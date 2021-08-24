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
import { Field } from "formik";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import {
  GroupSelectField,
  Head,
  Nav,
  useAddPersonModal
} from "../../../components";
import { useAttachmentsModal } from "../../../components/object-store";
import { AttachmentReadOnlySection } from "../../../components/object-store/attachment-list/AttachmentReadOnlySection";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Person } from "../../../types/agent-api";
import { Metadata } from "../../../types/objectstore-api";
import {
  PcrBatch,
  PcrPrimer,
  PcrProfile,
  Region
} from "../../../types/seqdb-api";

export function usePcrBatchQuery(id?: string) {
  const { bulkGet } = useApiClient();

  return useQuery<PcrBatch>(
    {
      path: `seqdb-api/pcr-batch/${id}`,
      include:
        "primerForward,primerReverse,region,thermocyclerProfile,experimenters,attachment"
    },
    {
      disabled: !id,
      onSuccess: async ({ data: pcrBatch }) => {
        if (pcrBatch.experimenters) {
          const agents = await bulkGet<Person>(
            pcrBatch.experimenters.map(
              experimenter => `/person/${experimenter.id}`
            ),
            { apiBaseUrl: "/agent-api", returnNullForMissingResource: true }
          );
          // Omit null (deleted) records:
          pcrBatch.experimenters = agents.filter(it => it);
        }

        if (pcrBatch.attachment) {
          try {
            const metadatas = await bulkGet<Metadata>(
              pcrBatch.attachment.map(collector => `/metadata/${collector.id}`),
              {
                apiBaseUrl: "/objectstore-api",
                returnNullForMissingResource: true
              }
            );
            // Omit null (deleted) records:
            pcrBatch.attachment = metadatas.filter(it => it);
          } catch (error) {
            console.warn("Attachment join failed: ", error);
          }
        }
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

  async function moveToViewPage(savedResource: PersistedResource<PcrBatch>) {
    await router.push(`/seqdb/pcr-batch/view?id=${savedResource.id}`);
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

  // The selected Metadatas to be attached to this Collecting Event:
  const { selectedMetadatas, attachedMetadatasUI } = useAttachmentsModal({
    initialMetadatas: pcrBatch?.attachment as PersistedResource<Metadata>[],
    deps: [pcrBatch?.id],
    title: <DinaMessage id="attachments" />
  });

  const initialValues = pcrBatch || {
    // TODO let the back-end set this:
    createdBy: username,
    type: "pcr-batch"
  };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<PcrBatch>) {
    // Init relationships object for one-to-many relations:
    (submittedValues as any).relationships = {};

    if (submittedValues.experimenters) {
      (submittedValues as any).relationships.experimenters = {
        data: submittedValues?.experimenters.map(collector => ({
          id: (collector as Person).id,
          type: "person"
        }))
      };
    }
    delete submittedValues.experimenters;

    // Add attachments if they were selected:
    if (selectedMetadatas.length) {
      (submittedValues as any).relationships.attachment = {
        data: selectedMetadatas.map(it => ({ id: it.id, type: it.type }))
      };
    }
    // Delete the 'attachment' attribute because it should stay in the relationships field:
    delete submittedValues.attachment;

    const inputResource = {
      ...submittedValues,

      // Override the "type" attribute with the JSONAPI resource type:
      ...(submittedValues.primerForward && {
        primerForward: {
          id: submittedValues.primerForward.id,
          type: "pcr-primer"
        }
      }),
      ...(submittedValues.primerReverse && {
        primerReverse: {
          id: submittedValues.primerReverse.id,
          type: "pcr-primer"
        }
      })
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
      {attachedMetadatasUI}
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
        <TextField className="col-md-6" name="name" />
        <ResourceSelectField<PcrProfile>
          className="col-md-6"
          name="thermocyclerProfile"
          filter={filterBy(["name"])}
          model="seqdb-api/thermocycler-profile"
          optionLabel={profile => profile.name}
          readOnlyLink="/seqdb/pcr-profile/view?id="
        />
      </div>
      <div className="row">
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
        <ResourceSelectField<Region>
          className="col-md-6"
          name="region"
          filter={filterBy(["name"])}
          model="seqdb-api/region"
          optionLabel={region => region.name}
          readOnlyLink="/seqdb/region/view?id="
        />
      </div>
      <div className="row">
        <ResourceSelectField<PcrPrimer>
          className="col-md-6"
          name="primerForward"
          filter={filterBy(["name"])}
          model="seqdb-api/pcr-primer"
          optionLabel={primer => `${primer.name} (#${primer.lotNumber})`}
          readOnlyLink="/seqdb/pcr-primer/view?id="
        />
        <ResourceSelectField<PcrPrimer>
          className="col-md-6"
          name="primerReverse"
          filter={filterBy(["name"])}
          model="seqdb-api/pcr-primer"
          optionLabel={primer => `${primer.name} (#${primer.lotNumber})`}
          readOnlyLink="/seqdb/pcr-primer/view?id="
        />
        <TextField className="col-md-6" name="thermocycler" />
        <TextField className="col-md-6" name="objective" />
        <TextField className="col-md-6" name="positiveControl" />
        <TextField className="col-md-6" name="reactionVolume" />
        <DateField className="col-md-6" name="reactionDate" />
      </div>
      {readOnly && (
        <div className="mb-3">
          <Field name="id">
            {({ field: { value: id } }) => (
              <AttachmentReadOnlySection
                attachmentPath={`seqdb-api/pcr-batch/${id}/attachment`}
                detachTotalSelected={true}
                title={<DinaMessage id="attachments" />}
              />
            )}
          </Field>
        </div>
      )}
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
