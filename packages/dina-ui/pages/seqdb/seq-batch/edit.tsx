import {
  BackButton,
  ButtonBar,
  CheckBoxField,
  DateField,
  DinaForm,
  DinaFormProps,
  DinaFormSubmitParams,
  filterBy,
  LoadingSpinner,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useAccount,
  useDinaFormContext,
  useQuery,
  withResponse,
  withResponseOrDisabled
} from "common-ui";
import { connect, useFormikContext } from "formik";
import { PersistedResource } from "kitsu";
import { cloneDeep, pick } from "lodash";
import { useRouter } from "next/router";
import {
  Protocol,
  StorageUnit,
  StorageUnitType
} from "packages/dina-ui/types/collection-api";
import { ReactNode } from "react";
import {
  GroupSelectField,
  Head,
  Nav,
  PersonSelectField,
  StorageUnitSelectField,
  VocabularySelectField
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
      include:
        "region,thermocyclerProfile,experimenters,protocol,,storageUnit,storageUnitType"
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
    const inputResourceWithRelationships = {
      ...submittedValues,

      // Relationships with an array will need to be handled separately and removed from attributes.
      relationships: {
        ...(submittedValues.experimenters && {
          experimenters: {
            data: submittedValues?.experimenters?.map((collector) =>
              pick(collector, "id", "type")
            )
          }
        })
      },
      experimenters: undefined
    };

    // Storage Unit or Storage Unit Type can be set but not both.
    if (inputResourceWithRelationships.storageUnit?.id) {
      (inputResourceWithRelationships as any).storageUnitType = {
        id: null,
        type: "storage-unit-type"
      };
    } else if (inputResourceWithRelationships.storageUnitType?.id) {
      (inputResourceWithRelationships as any).storageUnit = {
        id: null,
        type: "storage-unit"
      };
    } else {
      // Clear both in this case.
      (inputResourceWithRelationships as any).storageUnit = {
        id: null,
        type: "storage-unit"
      };
      (inputResourceWithRelationships as any).storageUnitType = {
        id: null,
        type: "storage-unit-type"
      };
    }

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
    <LoadExternalDataForSeqBatchForm
      dinaFormProps={{
        onSubmit,
        initialValues: initialValues as any,
        readOnly: readOnlyOverride
      }}
      buttonBar={buttonBar as any}
    />
  );
}

interface LoadExternalDataForSeqBatchFormProps {
  dinaFormProps: DinaFormProps<SeqBatch>;
  buttonBar?: ReactNode;
}

export function LoadExternalDataForSeqBatchForm({
  dinaFormProps,
  buttonBar
}: LoadExternalDataForSeqBatchFormProps) {
  // Create a copy of the initial value so we don't change the prop version.
  const initialValues = cloneDeep(dinaFormProps.initialValues);

  // Query to perform if a storage unit is present, used to retrieve the storageUnitType.
  const storageUnitQuery = useQuery<StorageUnit>(
    {
      path: `collection-api/storage-unit/${initialValues?.storageUnit?.id}`,
      include: "storageUnitType"
    },
    {
      disabled: !initialValues?.storageUnit?.id
    }
  );

  // Add the storage unit type to the initial values.
  if (storageUnitQuery?.response?.data) {
    initialValues.storageUnitType = storageUnitQuery?.response?.data
      ?.storageUnitType?.id
      ? {
          id: storageUnitQuery?.response.data.storageUnitType.id,
          type: "storage-unit-type"
        }
      : undefined;
  }

  // Display loading indicator if not ready.
  if (storageUnitQuery.loading) {
    return <LoadingSpinner loading={true} />;
  }

  // Wait for response or if disabled, just continue with rendering.
  return withResponseOrDisabled(storageUnitQuery, () => (
    <DinaForm<Partial<SeqBatch>>
      {...dinaFormProps}
      initialValues={initialValues}
    >
      {buttonBar}
      <SeqBatchFormFields />
    </DinaForm>
  ));
}

/** Re-usable field layout between edit and view pages. */
export function SeqBatchFormFields() {
  const { readOnly, initialValues } = useDinaFormContext();
  const { values } = useFormikContext<any>();

  // When the storage unit type is changed, the storage unit needs to be cleared.
  const StorageUnitTypeSelectorComponent = connect(
    ({ formik: { setFieldValue } }) => {
      return (
        <ResourceSelectField<StorageUnitType>
          name="storageUnitType"
          filter={filterBy(["name"])}
          model="collection-api/storage-unit-type"
          optionLabel={(storageUnitType) => `${storageUnitType.name}`}
          readOnlyLink="/collection/storage-unit-type/view?id="
          onChange={(storageUnitType) => {
            setFieldValue("storageUnit.id", null);
            if (
              !Array.isArray(storageUnitType) &&
              storageUnitType?.gridLayoutDefinition != null
            ) {
              setFieldValue(
                "storageRestriction.layout",
                storageUnitType.gridLayoutDefinition
              );
            } else {
              setFieldValue("storageRestriction", null);
            }
          }}
        />
      );
    }
  );

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
          name="sequencingType"
          path="seqdb-api/vocabulary/sequencingType"
        />
        <ResourceSelectField<ThermocyclerProfile>
          className="col-md-6"
          name="thermocyclerProfile"
          filter={filterBy(["name"])}
          model="seqdb-api/thermocycler-profile"
          optionLabel={(profile) => profile.name}
          readOnlyLink="/seqdb/thermocycler-profile/view?id="
        />
        <PersonSelectField
          className="col-md-6"
          name="experimenters"
          isMulti={true}
        />
        <DateField className="col-md-6" name="reactionDate" />
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
        <div className="col-md-6">
          <StorageUnitTypeSelectorComponent />
        </div>
        <div className="col-md-6">
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
              isDisabled: !values?.storageUnitType?.id
            }}
            restrictedField={"data.relationships.storageUnitType.data.id"}
            restrictedFieldValue={values?.storageUnitType?.id}
          />
        </div>
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
