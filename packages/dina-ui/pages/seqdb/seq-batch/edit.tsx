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
  import { PersistedResource } from "kitsu";
  import { useRouter } from "next/router";
  import { ReactNode } from "react";
  import {
    AttachmentsField,
    GroupSelectField,
    Head,
    Nav,
    PersonSelectField,
    useAddPersonModal
  } from "../../../components";
  import { DinaMessage } from "../../../intl/dina-ui-intl";
  import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
  import { Person } from "../../../types/agent-api";
  import {
    PcrBatch,
    PcrPrimer,
    PcrProfile,
    Region
  } from "../../../types/seqdb-api";
  
  export function usePcrBatchQuery(id?: string, deps?: any[]) {
    return useQuery<PcrBatch>(
      {
        path: `seqdb-api/seq_batch/${id}`,
        include:
          "primerForward,primerReverse,region,thermocyclerProfile,experimenters,attachment"
      },
      { disabled: !id, deps }
    );
  }
  
  export default function PcrBatchEditPage() {
    const router = useRouter();
    const { formatMessage } = useSeqdbIntl();
  
    const id = router.query.id?.toString();
  
    const resourceQuery = usePcrBatchQuery(id);
  
    const title = id ? "editPcrBatchTitle" : "addPcrBatchTitle";
  
    async function moveToViewPage(savedResource: PersistedResource<PcrBatch>) {
      await router.push(`/seqdb/seq_batch/view?id=${savedResource.id}`);
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
    buttonBar?: ReactNode;
  }
  
  export function PcrBatchForm({
    pcrBatch,
    onSaved,
    buttonBar = (
      <ButtonBar>
        <BackButton entityId={pcrBatch?.id} entityLink="/seqdb/seq_batch" />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
    )
  }: PcrBatchFormProps) {
    const { username } = useAccount();
  
    const initialValues = pcrBatch || {
      // TODO let the back-end set this:
      createdBy: username,
      type: "seq_batch"
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
      (submittedValues as any).relationships.attachment = {
        data:
          submittedValues.attachment?.map(it => ({
            id: it.id,
            type: it.type
          })) ?? []
      };
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
            type: "seq_batch"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      );
      await onSaved(savedResource);
    }
  
    return (
      <DinaForm<Partial<SeqBatch>>
        initialValues={initialValues}
        onSubmit={onSubmit}
      >
        {buttonBar}
        <PcrBatchFormFields />
        {buttonBar}
      </DinaForm>
    );
  }
  
  /** Re-usable field layout between edit and view pages. */
  export function PcrBatchFormFields() {
    const { readOnly, initialValues } = useDinaFormContext();
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
          <PersonSelectField
            className="col-md-6"
            name="experimenters"
            isMulti={true}
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
        <AttachmentsField
          name="attachment"
          attachmentPath={`seqdb-api/seq_batch/${initialValues.id}/attachment`}
          title={<DinaMessage id="attachments" />}
        />
        {readOnly && (
          <div className="row">
            <DateField className="col-md-6" name="createdOn" />
            <TextField className="col-md-6" name="createdBy" />
          </div>
        )}
      </div>
    );
  }
  