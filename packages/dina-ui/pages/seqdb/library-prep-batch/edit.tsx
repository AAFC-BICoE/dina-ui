import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormProps,
  DinaFormSubmitParams,
  filterBy,
  NumberField,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useAccount,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { connect, useFormikContext } from "formik";
import { PersistedResource } from "kitsu";
import { cloneDeep } from "lodash";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import {
  Footer,
  GroupSelectField,
  Head,
  Nav,
  StorageUnitSelectField
} from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Protocol, StorageUnitType } from "../../../types/collection-api";
import {
  IndexSet,
  LibraryPrepBatch,
  Product,
  ThermocyclerProfile
} from "../../../types/seqdb-api";

export function useLibraryPrepBatchQuery(id?: string, deps?: any[]) {
  return useQuery<LibraryPrepBatch>(
    {
      path: `seqdb-api/library-prep-batch/${id}`,
      include:
        "product,protocol,thermocyclerProfile,storageUnit,storageUnitType,indexSet"
    },
    { disabled: !id, deps }
  );
}
export default function LibraryPrepBatchEditPage() {
  const router = useRouter();
  const { formatMessage } = useSeqdbIntl();

  const id = router.query.id?.toString();

  const resourceQuery = useLibraryPrepBatchQuery(id);

  const title = id ? "editLibraryPrepBatchTitle" : "addLibraryPrepBatchTitle";

  async function moveToViewPage(
    savedResource: PersistedResource<LibraryPrepBatch>
  ) {
    await router.push(`/seqdb/library-prep-batch/view?id=${savedResource.id}`);
  }

  return (
    <>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id={title} />
        </h1>
        {id ? (
          withResponse(resourceQuery, ({ data: libraryPrepBatchData }) => (
            <LibraryPrepBatchForm
              libraryPrepBatch={libraryPrepBatchData}
              onSaved={moveToViewPage}
            />
          ))
        ) : (
          <LibraryPrepBatchForm onSaved={moveToViewPage} />
        )}
      </main>
      <Footer />
    </>
  );
}

export interface LibraryPrepBatchFormProps {
  libraryPrepBatch?: PersistedResource<LibraryPrepBatch>;
  results?: { [key: string]: string };
  onSaved: (resource: PersistedResource<LibraryPrepBatch>) => Promise<void>;
  buttonBar?: ReactNode;
  readOnlyOverride?: boolean;
}

export function LibraryPrepBatchForm({
  libraryPrepBatch,
  onSaved,
  buttonBar = (
    <ButtonBar className="mb-3">
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton
          entityId={libraryPrepBatch?.id}
          entityLink="/seqdb/library-prep-batch"
        />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  ),
  readOnlyOverride
}: LibraryPrepBatchFormProps) {
  const { username } = useAccount();

  const initialValues = libraryPrepBatch || {
    createdBy: username,
    type: "library-prep-batch"
  };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<LibraryPrepBatch & { [key: string]: string }>) {
    // Init relationships object for one-to-many relations:
    (submittedValues as any).relationships = {};

    // Storage unit type is not stored, used to help filter the storage unit dropdown.
    delete submittedValues.storageUnitType;
    if (submittedValues.storageUnit) {
      (submittedValues as any).relationships.storageUnit = {
        data:
          submittedValues.storageUnit.id !== null
            ? {
                id: submittedValues.storageUnit.id,
                type: "storage-unit"
              }
            : null
      };
      delete submittedValues.storageUnit;
    }

    if (submittedValues.product) {
      (submittedValues as any).relationships.product = {
        data:
          submittedValues.product.id !== null
            ? {
                id: submittedValues.product.id,
                type: "product"
              }
            : null
      };
      delete submittedValues.product;
    }

    if (submittedValues.protocol) {
      (submittedValues as any).relationships.protocol = {
        data:
          submittedValues.protocol.id !== null
            ? {
                id: submittedValues.protocol.id,
                type: "protocol"
              }
            : null
      };
      delete submittedValues.protocol;
    }

    if (submittedValues.thermocyclerProfile) {
      (submittedValues as any).relationships.thermocyclerProfile = {
        data:
          submittedValues.thermocyclerProfile.id !== null
            ? {
                id: submittedValues.thermocyclerProfile.id,
                type: "thermocycler-profile"
              }
            : null
      };
      delete submittedValues.thermocyclerProfile;
    }

    if (submittedValues.indexSet) {
      (submittedValues as any).relationships.indexSet = {
        data:
          submittedValues.indexSet.id !== null
            ? {
                id: submittedValues.indexSet.id,
                type: "index-set"
              }
            : null
      };
      delete submittedValues.indexSet;
    }

    const [savedResource] = await save<LibraryPrepBatch>(
      [
        {
          resource: submittedValues,
          type: "library-prep-batch"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
    await onSaved(savedResource);
  }
  return (
    <LoadExternalDataForLibraryPrepBatchForm
      dinaFormProps={{
        onSubmit,
        initialValues: initialValues as any,
        readOnly: readOnlyOverride
      }}
      buttonBar={buttonBar as any}
    />
  );
}

interface LoadExternalDataForLibraryPrepBatchFormProps {
  dinaFormProps: DinaFormProps<LibraryPrepBatch>;
  buttonBar?: ReactNode;
}

export function LoadExternalDataForLibraryPrepBatchForm({
  dinaFormProps,
  buttonBar
}: LoadExternalDataForLibraryPrepBatchFormProps) {
  // Create a copy of the initial value so we don't change the prop version.
  const initialValues = cloneDeep(dinaFormProps.initialValues);

  return (
    <DinaForm<Partial<LibraryPrepBatch>>
      {...dinaFormProps}
      initialValues={initialValues}
    >
      {buttonBar}
      <LibraryPrepBatchFormFields />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
function LibraryPrepBatchFormFields() {
  const { readOnly } = useDinaFormContext();
  const { values } = useFormikContext<any>();

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

  return (
    <div>
      <div className="row">
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-12"
          />
        )}
        <TextField className="col-md-6" name="name" />
        {/* <CheckBoxField
          name="isCompleted"
          className="gap-3 col-md-6"
          overridecheckboxProps={{
            style: {
              height: "30px",
              width: "30px"
            }
          }}
        /> */}
        <DateField className="col-md-6" name="dateUsed" />
        <ResourceSelectField<Product>
          className="col-md-6"
          name="product"
          filter={filterBy(["name"])}
          model="seqdb-api/product"
          optionLabel={(product) => product.name}
        />
        <ResourceSelectField<Protocol>
          className="col-md-6"
          name="protocol"
          filter={filterBy(["name"])}
          model="collection-api/protocol"
          optionLabel={(protocol) => protocol.name}
        />
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
        />
        <ResourceSelectField<ThermocyclerProfile>
          className="col-md-6"
          name="thermocyclerProfile"
          filter={filterBy(["name"])}
          model="seqdb-api/thermocycler-profile"
          optionLabel={(profile) => profile.name}
          readOnlyLink="/seqdb/thermocycler-profile/view?id="
        />
        <ResourceSelectField<IndexSet>
          className="col-md-6"
          name="indexSet"
          filter={filterBy(["name"])}
          model="seqdb-api/index-set"
          optionLabel={(set) => set.name}
          readOnlyLink="/seqdb/index-set/view?id="
        />
        <NumberField className="col-md-6" name="totalLibraryYieldNm" />
        <TextField className="col-md-6" name="yieldNotes" multiLines={true} />
        <TextField className="col-md-6" name="cleanUpNotes" multiLines={true} />
        <TextField className="col-md-6" name="notes" multiLines={true} />
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
