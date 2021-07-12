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
  StorageLinkerField,
  StorageTreeListField,
  StorageUnitBreadCrumb,
  storageUnitDisplayName
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { StorageUnit, StorageUnitType } from "../../../types/collection-api";

export function useStorageUnit(id?: string) {
  return useQuery<StorageUnit>(
    {
      path: `collection-api/storage-unit/${id}`,
      include: "storageUnitType,parentStorageUnit"
    },
    {
      disabled: !id,
      // parentStorageUnit must be fetched separately to include its hierarchy:
      joinSpecs: [
        {
          apiBaseUrl: "/collection-api",
          idField: "parentStorageUnit.id",
          joinField: "parentStorageUnit",
          path: storageUnit =>
            `storage-unit/${storageUnit.parentStorageUnit?.id}?include=hierarchy`
        }
      ]
    }
  );
}

export default function StorageUnitEditPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const id = router.query.id?.toString();

  const storageUnitQuery = useStorageUnit(id);

  const title = id ? "editStorageUnitTitle" : "addStorageUnitTitle";

  async function goToViewPage(resource: PersistedResource<StorageUnit>) {
    await router.push(`/collection/storage-unit/view?id=${resource.id}`);
  }

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <div className="container">
        <h1>
          <DinaMessage id={title} />
        </h1>
        {id ? (
          withResponse(storageUnitQuery, ({ data }) => (
            <>
              <Head title={storageUnitDisplayName(data)} />
              <StorageUnitForm storageUnit={data} onSaved={goToViewPage} />
            </>
          ))
        ) : (
          <StorageUnitForm onSaved={goToViewPage} />
        )}
      </div>
    </div>
  );
}

export interface StorageUnitFormProps {
  storageUnit?: PersistedResource<StorageUnit>;
  onSaved: (storageUnit: PersistedResource<StorageUnit>) => Promise<void>;
}

export function StorageUnitForm({
  storageUnit,
  onSaved
}: StorageUnitFormProps) {
  const initialValues = storageUnit || { type: "storage-unit" };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<StorageUnit>) {
    const [savedStorage] = await save<StorageUnit>(
      [
        {
          resource: submittedValues,
          type: "storage-unit"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    await onSaved(savedStorage);
  }

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={storageUnit?.id}
        entityLink="/collection/storage-unit"
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm<Partial<StorageUnit>>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {buttonBar}
      <StorageUnitFormFields />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
export function StorageUnitFormFields() {
  const { readOnly, initialValues } = useDinaFormContext();

  return (
    <div>
      <Field>
        {({ form: { values: storageUnit } }) => (
          <h2>
            <StorageUnitBreadCrumb
              storageUnit={storageUnit}
              // Don't have the page link to itself:
              disableLastLink={true}
            />
          </h2>
        )}
      </Field>
      <div className="row">
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        <ResourceSelectField<StorageUnitType>
          className="col-md-6"
          model="collection-api/storage-unit-type"
          name="storageUnitType"
          optionLabel={it => it.name}
          filter={input => ({
            ...filterBy(["name"])(input)
          })}
        />
      </div>
      <StorageLinkerField
        name="parentStorageUnit"
        excludeOptionId={initialValues.id}
      />
      {readOnly && (
        <StorageTreeListField parentId={initialValues.id} disabled={true} />
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
