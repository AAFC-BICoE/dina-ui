import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Collection, StorageUnitType } from "../../../types/collection-api";

export default function StorageUnitTypeEditPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();

  const {
    query: { id }
  } = router;

  const storageUnitTypeQuery = useQuery<StorageUnitType>(
    { path: `collection-api/storage-unit-type/${id}` },
    { disabled: !id }
  );

  const title = id ? "editStorageUnitTypeTitle" : "addStorageUnitTypeTitle";

  async function goToViewPage(resource: PersistedResource<StorageUnitType>) {
    await router.push(`/collection/storage-unit-type/view?id=${resource.id}`);
  }

  return (
    <div>
      <Head title={formatMessage(title)}
						lang={formatMessage("languageOfPage")}
						creator={formatMessage("agricultureCanada")}
						subject={formatMessage("subjectTermsForPage")} />
			<Nav />
      <div className="container">
        <h1 id="wb-cont">
          <DinaMessage id={title} />
        </h1>
        {id ? (
          withResponse(storageUnitTypeQuery, ({ data }) => (
            <StorageUnitTypeForm
              storageUnitType={data}
              onSaved={goToViewPage}
            />
          ))
        ) : (
          <StorageUnitTypeForm onSaved={goToViewPage} />
        )}
      </div>
    </div>
  );
}

export interface StorageUnitTypeFormProps {
  storageUnitType?: PersistedResource<StorageUnitType>;
  onSaved: (
    storageUnitType: PersistedResource<StorageUnitType>
  ) => Promise<void>;
}

export function StorageUnitTypeForm({
  storageUnitType,
  onSaved
}: StorageUnitTypeFormProps) {
  const initialValues = storageUnitType || { type: "storage-unit-type" };

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<StorageUnitType>) {
    const [savedStorageType] = await save<StorageUnitType>(
      [
        {
          resource: submittedValues,
          type: "storage-unit-type"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    await onSaved(savedStorageType);
  }

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={storageUnitType?.id}
        entityLink="/collection/storage-unit-type"
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm<Partial<StorageUnitType>>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {buttonBar}
      <StorageUnitTypeFormFields />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
export function StorageUnitTypeFormFields() {
  const { readOnly } = useDinaFormContext();

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
