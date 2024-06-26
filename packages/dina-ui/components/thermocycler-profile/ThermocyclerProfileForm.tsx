import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton
} from "common-ui";
import { ThermocyclerProfileFormFields } from "./ThermocyclerProfileFormFields";
import { NextRouter } from "next/router";
import { ThermocyclerProfile } from "../../types/seqdb-api"; // "packages/dina-ui/types/seqdb-api"

export interface ThermocyclerProfileFormProps {
  thermocyclerProfile?: ThermocyclerProfile;
  router?: NextRouter;
  readOnly: boolean;
}

export function ThermocyclerProfileForm({
  thermocyclerProfile,
  router,
  readOnly
}: ThermocyclerProfileFormProps) {
  const id = router?.query?.id;

  const initialValues = {
    type: "thermocycler-profile",
    ...thermocyclerProfile,
    ...(thermocyclerProfile?.steps
      ? { steps: thermocyclerProfile.steps.map((value) => ({ step: value })) }
      : { steps: [""] })
  };
  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    submittedValues.steps = submittedValues.steps.map((value) => value.step);
    const response = await save(
      [
        {
          resource: submittedValues,
          type: "thermocycler-profile"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router?.push(`/seqdb/thermocycler-profile/view?id=${newId}`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar className="mb-3">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={id as string}
            entityLink="/seqdb/thermocycler-profile"
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <ThermocyclerProfileFormFields readOnly={readOnly} />
    </DinaForm>
  );
}
