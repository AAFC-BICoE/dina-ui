import { NextRouter } from "next/router";
import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  DinaFormSubmitParams,
  SubmitButton,
  TextField
} from "../../../common-ui/lib";
import { Group } from "../../../dina-ui/types/user-api";
import { GroupLabelsEditor } from "./GroupLabelsEditor";

export interface GroupFormProps {
  group?: Group;
  router: NextRouter;
}

export function GroupForm({ group, router }: GroupFormProps) {
  const { id } = router.query;
  const initialValues: Group =
    group ||
    ({
      type: "group"
    } as Group);

  const onSubmit: DinaFormOnSubmit = async ({
    api: { apiClient },
    submittedValues
  }: DinaFormSubmitParams<Group>) => {
    const response = await apiClient.axios.post(
      "/user-api/group",
      {
        data: {
          id: submittedValues.id,
          type: "group",
          attributes: {
            name: submittedValues.name,
            labels: submittedValues.labels
          }
        }
      },
      {
        headers: {
          "Content-Type": "application/vnd.api+json"
        }
      }
    );

    const newId = response?.data?.data?.id;
    await router.push(`/group/view?id=${newId}`);
  };

  return (
    <DinaForm<Group> initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar className="mb-3">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton entityId={id as string} entityLink="/group" />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <GroupFormFields group={group || ({} as Group)} />
    </DinaForm>
  );
}

export function GroupFormFields({ group }: { group: Group }) {
  return (
    <div>
      <div className="row">
        <TextField className="col-md-2" name="name" label="name" />
      </div>
      <GroupLabelsEditor labels={group.labels} valuesPath="labels" />
    </div>
  );
}
