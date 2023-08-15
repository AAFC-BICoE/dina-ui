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
  useApiClient,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { useFormikContext } from "formik";
import { PersistedResource } from "kitsu";
import { cloneDeep } from "lodash";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Protocol } from "../../../types/collection-api";
import {
  ContainerType,
  LibraryPrepBatch2,
  Product,
  ThermocyclerProfile
} from "../../../types/seqdb-api";

export function useLibraryPrepBatchQuery(id?: string, deps?: any[]) {
  return useQuery<LibraryPrepBatch2>(
    {
      path: `seqdb-api/library-prep-batch/${id}`,
      include: "containerType,product,protocol,thermocyclerProfile"
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
    savedResource: PersistedResource<LibraryPrepBatch2>
  ) {
    await router.push(`/seqdb/library-prep-batch/view?id=${savedResource.id}`);
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
          withResponse(resourceQuery, ({ data: libraryPrepBatchData }) => (
            <LibraryPrepBatchForm
              libraryPrepBatch={libraryPrepBatchData}
              onSaved={moveToViewPage}
            />
          ))
        ) : (
          <LibraryPrepBatchForm onSaved={moveToViewPage} />
        )}
      </div>
    </div>
  );
}

export interface LibraryPrepBatchFormProps {
  libraryPrepBatch?: PersistedResource<LibraryPrepBatch2>;
  results?: { [key: string]: string };
  onSaved: (resource: PersistedResource<LibraryPrepBatch2>) => Promise<void>;
  buttonBar?: ReactNode;
  readOnlyOverride?: boolean;
}

export function LibraryPrepBatchForm({
  libraryPrepBatch,
  onSaved,
  buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={libraryPrepBatch?.id}
        entityLink="/seqdb/library-prep-batch"
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  ),
  readOnlyOverride
}: LibraryPrepBatchFormProps) {
  const { username } = useAccount();
  const { doOperations } = useApiClient();

  const initialValues = libraryPrepBatch || {
    createdBy: username,
    type: "library-prep-batch"
  };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<LibraryPrepBatch2 & { [key: string]: string }>) {
    // Init relationships object for one-to-many relations:
    (submittedValues as any).relationships = {};

    if (submittedValues.containerType) {
      (submittedValues as any).relationships.containerType = {
        data: {
          id: submittedValues.containerType.id,
          type: "container-type"
        }
      };
    }
    delete submittedValues.containerType;

    if (submittedValues.product) {
      (submittedValues as any).relationships.product = {
        data: {
          id: submittedValues.product.id,
          type: "product"
        }
      };
    }
    delete submittedValues.product;

    if (submittedValues.protocol) {
      (submittedValues as any).relationships.protocol = {
        data: {
          id: submittedValues.protocol.id,
          type: "protocol"
        }
      };
    }
    delete submittedValues.protocol;

    if (submittedValues.thermocyclerProfile) {
      (submittedValues as any).relationships.thermocyclerProfile = {
        data: {
          id: submittedValues.thermocyclerProfile.id,
          type: "thermocycler-profile"
        }
      };
    }
    delete submittedValues.thermocyclerProfile;

    const [savedResource] = await save<LibraryPrepBatch2>(
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
  dinaFormProps: DinaFormProps<LibraryPrepBatch2>;
  buttonBar?: ReactNode;
}

export function LoadExternalDataForLibraryPrepBatchForm({
  dinaFormProps,
  buttonBar
}: LoadExternalDataForLibraryPrepBatchFormProps) {
  // Create a copy of the initial value so we don't change the prop version.
  const initialValues = cloneDeep(dinaFormProps.initialValues);

  // // Display loading indicator if not ready.
  // if (storageUnitQuery.loading) {
  //   return <LoadingSpinner loading={true} />;
  // }

  // // Wait for response or if disabled, just continue with rendering.
  // return withResponseOrDisabled(storageUnitQuery, () => (
  //   <DinaForm<Partial<SeqBatch>>
  //     {...dinaFormProps}
  //     initialValues={initialValues}
  //   >
  //     {buttonBar}
  //     <LibraryPrepBatchFormFields />
  //   </DinaForm>
  // ));

  return (
    <DinaForm<Partial<LibraryPrepBatch2>>
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
  const { readOnly, initialValues } = useDinaFormContext();
  const { values } = useFormikContext<any>();

  return (
    <div>
      <div className="row">
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
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
        <NumberField className="col-md-6" name="totalLibraryYieldNm" />
        <TextField className="col-md-6" name="notes" />
        <TextField className="col-md-6" name="cleanUpNotes" />
        <TextField className="col-md-6" name="yieldNotes" />
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
        <ResourceSelectField<ContainerType>
          className="col-md-6"
          name="containerType"
          filter={filterBy(["name"])}
          model="seqdb-api/container-type"
          optionLabel={(ct) => ct.name}
        />
        <ResourceSelectField<ThermocyclerProfile>
          className="col-md-6"
          name="thermocyclerProfile"
          filter={filterBy(["name"])}
          model="seqdb-api/thermocycler-profile"
          optionLabel={(profile) => profile.name}
          readOnlyLink="/seqdb/thermocycler-profile/view?id="
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
