import {
  BackButton,
  ButtonBar,
  CheckBoxField,
  DateField,
  DinaForm,
  DinaFormProps,
  DinaFormSubmitParams,
  FieldSet,
  filterBy,
  LoadingSpinner,
  Operation,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useAccount,
  useApiClient,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { connect, useFormikContext } from "formik";
import { PersistedResource } from "kitsu";
import _ from "lodash";
import { useRouter } from "next/router";
import {
  PcrReactionTable,
  usePcrReactionData
} from "../../../components/seqdb/pcr-workflow/PcrReactionTable";
import { ReactNode, useState } from "react";
import {
  Footer,
  GroupSelectField,
  Head,
  Nav,
  PersonSelectField,
  StorageUnitSelectField,
  VocabularySelectField
} from "../../../components";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Person } from "../../../types/agent-api";
import {
  MaterialSampleSummary,
  Protocol,
  StorageUnitType
} from "../../../types/collection-api";
import {
  PcrBatch,
  pcrBatchParser,
  PcrBatchItem,
  PcrPrimer,
  Region,
  ThermocyclerProfile
} from "../../../types/seqdb-api";

export function usePcrBatchQuery(id?: string, deps?: any[]) {
  return useQuery<PcrBatch>(
    {
      path: `seqdb-api/pcr-batch/${id}`,
      include:
        "primerForward,primerReverse,region,thermocyclerProfile,experimenters,attachment,storageUnit,storageUnitType,protocol"
    },
    { disabled: !id, deps, parser: pcrBatchParser }
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
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id={title} />
        </h1>
        {id ? (
          withResponse(resourceQuery, ({ data: pcrBatchData }) => (
            <PcrBatchForm pcrBatch={pcrBatchData} onSaved={moveToViewPage} />
          ))
        ) : (
          <PcrBatchForm onSaved={moveToViewPage} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export interface PcrBatchFormProps {
  pcrBatch?: PersistedResource<PcrBatch>;
  results?: { [key: string]: string };
  onSaved: (resource: PersistedResource<PcrBatch>) => Promise<void>;
  buttonBar?: ReactNode;
  readOnlyOverride?: boolean;
  isMetagenomicsWorkflow?: boolean;
}

export function PcrBatchForm({
  pcrBatch,
  onSaved,
  buttonBar = (
    <ButtonBar className="mb-3">
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton entityId={pcrBatch?.id} entityLink="/seqdb/pcr-batch" />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  ),
  readOnlyOverride,
  isMetagenomicsWorkflow
}: PcrBatchFormProps) {
  const { username } = useAccount();
  const { doOperations } = useApiClient();

  const initialValues = pcrBatch || {
    // TODO let the back-end set this:
    createdBy: username,
    type: "pcr-batch",
    batchType: isMetagenomicsWorkflow ? "illumina_metagenomics" : undefined
  };

  async function savePcrReactionResults(submittedValues: any) {
    const results = submittedValues.results;
    delete submittedValues.results;

    const resultsWithId = Object.keys(results).map((id) => ({
      id,
      value: results[id]
    }));
    if (resultsWithId.length > 0) {
      // Using the results, generate the operations.
      const operations = resultsWithId.map<Operation>((result) => ({
        op: "PATCH",
        path: "pcr-batch-item/" + result.id,
        value: {
          id: result.id,
          type: "pcr-batch-item",
          attributes: {
            result: result.value
          }
        }
      }));

      await doOperations(operations, { apiBaseUrl: "/seqdb-api" });
    }
  }

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<PcrBatch & { [key: string]: string }>) {
    savePcrReactionResults(submittedValues);
    // Init relationships object for one-to-many relations:
    (submittedValues as any).relationships = {};

    if (submittedValues.experimenters) {
      (submittedValues as any).relationships.experimenters = {
        data: submittedValues?.experimenters.map((collector) => ({
          id: (collector as Person).id,
          type: "person"
        }))
      };
    }
    delete submittedValues.experimenters;

    // Add attachments if they were selected:
    (submittedValues as any).relationships.attachment = {
      data:
        submittedValues.attachment?.map((it) => ({
          id: it.id,
          type: it.type
        })) ?? []
    };
    // Delete the 'attachment' attribute because it should stay in the relationships field:
    delete submittedValues.attachment;

    // Delete storage unit type
    delete submittedValues.storageUnitType;
    if (!submittedValues.storageUnit?.id) {
      (submittedValues as any).storageUnit = {
        id: null,
        type: "storage-unit"
      };
    }

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
  return (
    <LoadExternalDataForPcrBatchForm
      dinaFormProps={{
        onSubmit,
        initialValues: initialValues as any,
        readOnly: readOnlyOverride
      }}
      buttonBar={buttonBar as any}
      isMetagenomicsWorkflow={isMetagenomicsWorkflow}
    />
  );
}

interface LoadExternalDataForPcrBatchFormProps {
  dinaFormProps: DinaFormProps<PcrBatch>;
  buttonBar?: ReactNode;
  isMetagenomicsWorkflow?: boolean;
}

export function LoadExternalDataForPcrBatchForm({
  dinaFormProps,
  buttonBar,
  isMetagenomicsWorkflow
}: LoadExternalDataForPcrBatchFormProps) {
  const {
    loading: loadingReactionData,
    pcrBatchItems,
    materialSamples
  } = usePcrReactionData(dinaFormProps?.initialValues?.id);

  // Create a copy of the initial value so we don't change the prop version.
  const initialValues = _.assign(_.cloneDeep(dinaFormProps.initialValues), {
    results: Object.fromEntries(
      pcrBatchItems.map((obj) => [obj.id, obj.result])
    )
  });

  // Display loading indicator if not ready.
  if (loadingReactionData) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <DinaForm<Partial<PcrBatch>>
      {...dinaFormProps}
      initialValues={initialValues}
    >
      {buttonBar}
      <PcrBatchFormFields
        pcrBatchItems={pcrBatchItems}
        materialSamples={materialSamples}
        isMetagenomicsWorkflow={isMetagenomicsWorkflow}
      />
    </DinaForm>
  );
}

interface PcrBatchFormFieldsProps {
  pcrBatchItems: PcrBatchItem[];
  materialSamples: MaterialSampleSummary[];
  isMetagenomicsWorkflow?: boolean;
}

/** Re-usable field layout between edit and view pages. */
function PcrBatchFormFields({
  pcrBatchItems,
  materialSamples,
  isMetagenomicsWorkflow
}: PcrBatchFormFieldsProps) {
  const { readOnly, initialValues } = useDinaFormContext();
  const { values } = useFormikContext<any>();
  const [selectedRegion, setSelectedRegion] = useState<Region>(
    initialValues.region
  );

  // When the storage unit type is changed, the storage unit needs to be cleared.
  const StorageUnitTypeSelectorComponent = connect(
    ({ formik: { setFieldValue } }) => {
      return (
        <ResourceSelectField<StorageUnitType>
          className="col-md-6"
          name="storageUnitType"
          filter={filterBy(["name"])}
          model="collection-api/storage-unit-type"
          optionLabel={(storageUnitType) => `${storageUnitType.name}`}
          readOnlyLink="/collection/storage-unit-type/view?id="
          onChange={() => {
            setFieldValue("storageUnit.id", null);
          }}
        />
      );
    }
  );

  // When the region is changed, it should clear the forward and reverse primer.
  const RegionSelectorComponent = connect(({ formik: { setFieldValue } }) => {
    return (
      <ResourceSelectField<Region>
        className="col-md-6"
        name="region"
        filter={filterBy(["name"])}
        model="seqdb-api/region"
        optionLabel={(region) => region.name}
        readOnlyLink="/seqdb/region/view?id="
        onChange={(value) => {
          setSelectedRegion(value as Region);
          setFieldValue("primerForward", null);
          setFieldValue("primerReverse", null);
        }}
      />
    );
  });

  return (
    <div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
          />
        )}
        <CheckBoxField
          name="isCompleted"
          className="gap-3 col-md-6"
          overridecheckboxProps={{
            style: {
              height: "30px",
              width: "30px"
            }
          }}
        />
        <VocabularySelectField
          className="col-md-6"
          name="batchType"
          path="seqdb-api/vocabulary/pcrBatchType"
          isDisabled={isMetagenomicsWorkflow}
        />
        <RegionSelectorComponent />
        <ResourceSelectField<ThermocyclerProfile>
          className="col-md-6"
          name="thermocyclerProfile"
          filter={filterBy(["name"])}
          model="seqdb-api/thermocycler-profile"
          optionLabel={(profile) => profile.name}
          readOnlyLink="/seqdb/thermocycler-profile/view?id="
        />
        <TextField
          className="col-md-6"
          name="thermocycler"
          customName="thermocyclerUnit"
        />
      </div>
      <div className="row">
        <PersonSelectField
          className="col-md-6"
          name="experimenters"
          isMulti={true}
        />
        <ResourceSelectField<Protocol>
          className="col-md-6"
          name="protocol"
          filter={filterBy(["name"])}
          filterList={(resource) => resource.protocolType === "pcr_reaction"}
          model="collection-api/protocol"
          optionLabel={(protocol) => protocol.name}
        />
        <ResourceSelectField<PcrPrimer>
          className="col-md-6"
          name="primerForward"
          filter={(input) => ({
            ...filterBy(["name"])(input),
            direction: { EQ: "F" },
            "region.id": { EQ: selectedRegion?.id }
          })}
          model="seqdb-api/pcr-primer"
          optionLabel={(primer) => `${primer.name} (#${primer.lotNumber})`}
          readOnlyLink="/seqdb/pcr-primer/view?id="
          isDisabled={!(selectedRegion && selectedRegion.id)}
        />
        <ResourceSelectField<PcrPrimer>
          className="col-md-6"
          name="primerReverse"
          filter={(input) => ({
            ...filterBy(["name"])(input),
            direction: { EQ: "R" },
            "region.id": { EQ: selectedRegion?.id }
          })}
          model="seqdb-api/pcr-primer"
          optionLabel={(primer) => `${primer.name} (#${primer.lotNumber})`}
          readOnlyLink="/seqdb/pcr-primer/view?id="
          isDisabled={!(selectedRegion && selectedRegion.id)}
        />

        <TextField className="col-md-6" name="objective" />
        <TextField className="col-md-6" name="positiveControl" />
        <TextField className="col-md-6" name="reactionVolume" />
        <DateField className="col-md-6" name="reactionDate" />
        {!readOnly && <StorageUnitTypeSelectorComponent />}
        <StorageUnitSelectField
          resourceProps={{
            name: "storageUnit",
            filter: filterBy(["name"], {
              extraFilters: values?.storageUnitType?.id
                ? [
                    {
                      selector: "storageUnitType.uuid",
                      comparison: "==",
                      arguments: values?.storageUnitType?.id ?? ""
                    }
                  ]
                : undefined
            }),
            isDisabled: !values?.storageUnitType?.id,
            className: "col-md-6"
          }}
          restrictedField={"data.relationships.storageUnitType.data.id"}
          restrictedFieldValue={values?.storageUnitType?.id}
        />
      </div>
      {initialValues.id && (
        <FieldSet legend={<DinaMessage id="pcrReactionTitle" />}>
          <PcrReactionTable
            pcrBatchItems={pcrBatchItems}
            materialSamples={materialSamples}
          />
        </FieldSet>
      )}
      {/* <AttachmentsField
        name="attachment"
        attachmentPath={`seqdb-api/pcr-batch/${initialValues.id}/attachment`}
        title={<DinaMessage id="attachments" />}
      /> */}
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
