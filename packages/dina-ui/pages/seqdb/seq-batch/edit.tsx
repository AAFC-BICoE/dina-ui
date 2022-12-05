import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  filterBy,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useAccount,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { useFormikContext } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import { pick } from "lodash";
import { useRouter } from "next/router";
import { Protocol } from "packages/dina-ui/types/collection-api";
import { ReactNode } from "react";
import {
  GroupSelectField,
  Head,
  Nav,
  PersonSelectField
} from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import {
  Region,
  SeqBatch,
  ThermocyclerProfile
} from "../../../types/seqdb-api";

export function useSeqBatchQuery(id?: string, deps?: any[]) {
  return useQuery<SeqBatch>(
    {
      path: `seqdb-api/seq-batch/${id}`,
      include: "region,thermocyclerProfile,experimenters,protocol"
    },
    { disabled: !id, deps }
  );
}

export default function SeqBatchEditPage() {
  const router = useRouter();
  const { formatMessage } = useSeqdbIntl();

  const id = router.query.id?.toString();

  const resourceQuery = useSeqBatchQuery(id);

  const title = id ? "editSeqBatchTitle" : "addSeqBatchTitle";

  async function moveToViewPage(savedResource: PersistedResource<SeqBatch>) {
    await router.push(`/seqdb/seq-batch/view?id=${savedResource.id}`);
  }

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <div className="container">
        <h1 id="wb-cont">
          <SeqdbMessage id={title} />
        </h1>
        {id ? (
          withResponse(resourceQuery, ({ data: seqBatchData }) => (
            <SeqBatchForm seqBatch={seqBatchData} onSaved={moveToViewPage} />
          ))
        ) : (
          <SeqBatchForm onSaved={moveToViewPage} />
        )}
      </div>
    </div>
  );
}

export interface SeqBatchFormProps {
  seqBatch?: PersistedResource<SeqBatch>;
  onSaved: (resource: PersistedResource<SeqBatch>) => Promise<void>;
  buttonBar?: ReactNode;
  readOnlyOverride?: boolean;
}

export function SeqBatchForm({
  seqBatch,
  onSaved,
  buttonBar = (
    <ButtonBar>
      <BackButton entityId={seqBatch?.id} entityLink="/seqdb/seq-batch" />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  ),
  readOnlyOverride
}: SeqBatchFormProps) {
  const { username } = useAccount();

  const initialValues = seqBatch || {
    // TODO let the back-end set this:
    createdBy: username,
    type: "seq-batch"
  };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<SeqBatch>) {
    const inputResourceWithRelationships: InputResource<SeqBatch> & {
      relationships: any;
    } = {
      ...submittedValues,
      relationships: {
        ...(submittedValues.experimenters && {
          experimenters: {
            data: submittedValues?.experimenters?.map((collector) =>
              pick(collector, "id", "type")
            )
          }
        }),
        ...(submittedValues.region && {
          region: {
            data: pick(submittedValues?.region, "id", "type")
          }
        }),
        ...(submittedValues.thermocyclerProfile && {
          thermocyclerProfile: {
            data: pick(submittedValues?.thermocyclerProfile, "id", "type")
          }
        }),
        ...(submittedValues.protocol && {
          protocol: {
            data: pick(submittedValues?.protocol, "id", "type")
          }
        })
      },
      experimenters: undefined,
      protocol: undefined,
      thermocyclerProfile: undefined,
      region: undefined
    };
    const [savedResource] = await save<SeqBatch>(
      [
        {
          resource: inputResourceWithRelationships,
          type: "seq-batch"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
    await onSaved(savedResource);
  }

  return (
    <DinaForm<Partial<SeqBatch>>
      onSubmit={onSubmit}
      readOnly={readOnlyOverride}
      initialValues={initialValues}
    >
      {buttonBar}
      <SeqBatchFormFields />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
export function SeqBatchFormFields() {
  const { readOnly, initialValues } = useDinaFormContext();
  const { values } = useFormikContext<any>();

  return (
    <div>
      <div className="row">
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        <ResourceSelectField<ThermocyclerProfile>
          className="col-md-6"
          name="thermocyclerProfile"
          filter={filterBy(["name"])}
          model="seqdb-api/thermocycler-profile"
          optionLabel={(profile) => profile.name}
          readOnlyLink="/seqdb/thermocycler-profile/view?id="
        />
      </div>
      <div className="row">
        <PersonSelectField
          className="col-md-6"
          name="experimenters"
          isMulti={true}
        />
        <DateField className="col-md-6" name="reactionDate" />
      </div>
      <div className="row">
        <ResourceSelectField<Region>
          className="col-md-6"
          name="region"
          filter={filterBy(["name"])}
          model="seqdb-api/region"
          optionLabel={(region) => region.name}
          readOnlyLink="/seqdb/region/view?id="
        />
        <ResourceSelectField<Protocol>
          className="col-md-6"
          name="protocol"
          filter={filterBy(["name"])}
          model="collection-api/protocol"
          optionLabel={(protocol) => protocol.name}
        />
      </div>
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
