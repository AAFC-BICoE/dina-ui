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
  useApiClient,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import {
  GroupSelectField,
  Head,
  Nav,
  useAddPersonModal
} from "../../../components";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Person } from "../../../types/agent-api";
import { PcrBatch, PcrPrimer, Region } from "../../../types/seqdb-api";

export function usePcrBatchQuery(id?: string) {
  const { bulkGet } = useApiClient();

  return useQuery<PcrBatch>(
    {
      path: `seqdb-api/pcr-batch/${id}`,
      include: "primerForward,primerReverse,region"
    },
    {
      disabled: !id,
      onSuccess: async ({ data: pcrBatch }) => {
        // Convert UUID array to resource array:
        (pcrBatch as any).experimenters = await bulkGet<Person>(
          pcrBatch.experimenters?.map(
            personId => `person/${String(personId)}`
          ) ?? [],
          { apiBaseUrl: "/agent-api", returnNullForMissingResource: true }
        );
      }
    }
  );
}

export default function PcrBatchEditPage() {
  const router = useRouter();
  const { formatMessage } = useSeqdbIntl();

  const id = router.query.id?.toString();

  const resourceQuery = usePcrBatchQuery(id);

  const title = id ? "editPcrBatchTitle" : "addPcrBatchTitle";

  async function moveToViewPage(mst: PersistedResource<PcrBatch>) {
    await router.push(`/seqdb/pcr-batch/view?id=${mst.id}`);
  }

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <div className="container">
        <h1>
          <SeqdbMessage id={title} />
        </h1>
        {id ? (
          withResponse(resourceQuery, ({ data }) => (
            <PcrBatchForm pcrBatch={data} onSaved={moveToViewPage} />
          ))
        ) : (
          <PcrBatchForm onSaved={moveToViewPage} />
        )}
      </div>
    </div>
  );
}

export interface PcrBatchFormProps {
  pcrBatch?: PersistedResource<PcrBatch>;
  onSaved: (resource: PersistedResource<PcrBatch>) => Promise<void>;
}

export function PcrBatchForm({ pcrBatch, onSaved }: PcrBatchFormProps) {
  const { username } = useAccount();

  const initialValues = pcrBatch || {
    // TODO let the back-end set this:
    createdBy: username,
    type: "pcr-batch"
  };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<PcrBatch>) {
    const inputResource = {
      ...submittedValues,

      // Convert the experimenters resources to a UUID array:
      experimenters: (
        submittedValues.experimenters as PersistedResource<Person>[]
      )?.map(person => person.id),

      // Override the "type" attribute with the JSONAPI resource type:
      primerForward: submittedValues.primerForward
        ? { ...submittedValues.primerForward, type: "pcrPrimer" }
        : undefined,
      primerReverse: submittedValues.primerReverse
        ? { ...submittedValues.primerReverse, type: "pcrPrimer" }
        : undefined
    };

    const [savedResource] = await save<PcrBatch>(
      [
        {
          resource: inputResource,
          type: "pcr-batch"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
    await onSaved(savedResource);
  }

  const buttonBar = (
    <ButtonBar>
      <BackButton entityId={pcrBatch?.id} entityLink="/seqdb/pcr-batch" />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm<Partial<PcrBatch>>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {buttonBar}
      <PcrBatchFormFields />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
export function PcrBatchFormFields() {
  const { readOnly } = useDinaFormContext();
  const { openAddPersonModal } = useAddPersonModal();

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
        {/* <TextField className="col-md-6" name="name" /> */}
        <ResourceSelectField<Person>
          className="col-md-6"
          name="experimenters"
          readOnlyLink="/person/view?id="
          filter={filterBy(["displayName"])}
          model="agent-api/person"
          optionLabel={person => person.displayName}
          isMulti={true}
          asyncOptions={[
            {
              label: <DinaMessage id="addNewPerson" />,
              getResource: openAddPersonModal as any
            }
          ]}
        />
      </div>
      <div className="row">
        <ResourceSelectField<Region>
          className="col-md-6"
          name="region"
          filter={filterBy(["name"])}
          model="seqdb-api/region"
          optionLabel={region => region.name}
        />
      </div>
      <div className="row">
        <ResourceSelectField<PcrPrimer>
          className="col-md-6"
          name="primerForward"
          filter={filterBy(["name"])}
          model="seqdb-api/pcrPrimer"
          optionLabel={primer => `${primer.name} (#${primer.lotNumber})`}
          readOnlyLink="/seqdb/pcr-primer/view?id="
        />
        <ResourceSelectField<PcrPrimer>
          className="col-md-6"
          name="primerReverse"
          filter={filterBy(["name"])}
          model="seqdb-api/pcrPrimer"
          optionLabel={primer => `${primer.name} (#${primer.lotNumber})`}
          readOnlyLink="/seqdb/pcr-primer/view?id="
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
