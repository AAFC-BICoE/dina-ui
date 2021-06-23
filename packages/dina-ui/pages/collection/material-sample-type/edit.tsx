import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  TextField,
  useApiClient,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { Promisable } from "type-fest";
import { GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSampleType } from "../../../types/collection-api";

interface MaterialSampleTypeFormProps {
  fetchedMaterialSampleType?: PersistedResource<MaterialSampleType>;
  onSaved: (mst: PersistedResource<MaterialSampleType>) => Promisable<void>;
}

export default function MaterialSampleTypeEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  const pageTitle = id
    ? "editMaterialSampleTypeTitle"
    : "addMaterialSampleTypeTitle";

  const materialSampleTypeQuery = useQuery<MaterialSampleType>(
    { path: `collection-api/material-sample-type/${id}` },
    { disabled: !id }
  );

  async function moveToViewPage(mst: PersistedResource<MaterialSampleType>) {
    await router.push(`/collection/material-sample-type/view?id=${mst.id}`);
  }

  return (
    <div>
      <Head title={formatMessage(pageTitle)} />
      <Nav />
      <main className="container">
        <div>
          <h1>
            <DinaMessage id={pageTitle} />
          </h1>
          {id ? (
            withResponse(materialSampleTypeQuery, ({ data }) => (
              <MaterialSampleTypeForm
                fetchedMaterialSampleType={data}
                onSaved={moveToViewPage}
              />
            ))
          ) : (
            <MaterialSampleTypeForm onSaved={moveToViewPage} />
          )}
        </div>
      </main>
    </div>
  );
}

export function MaterialSampleTypeForm({
  fetchedMaterialSampleType,
  onSaved
}: MaterialSampleTypeFormProps) {
  const { save } = useApiClient();
  const initialValues = fetchedMaterialSampleType || {
    type: "material-sample-type"
  };

  const onSubmit: DinaFormOnSubmit = async ({ submittedValues }) => {
    const [savedMst] = await save<MaterialSampleType>(
      [
        {
          resource: submittedValues,
          type: "material-sample-type"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );
    await onSaved(savedMst);
  };

  return (
    <DinaForm
      initialValues={initialValues}
      readOnly={!!fetchedMaterialSampleType?.id}
      onSubmit={onSubmit}
    >
      <ButtonBar>
        <BackButton
          entityId={fetchedMaterialSampleType?.id}
          entityLink="/collection/material-sample-type"
          byPassView={true}
        />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <MaterialSampleTypeFormFields />
    </DinaForm>
  );
}

/** Re-usable field layout between edit and view pages. */
export function MaterialSampleTypeFormFields() {
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
