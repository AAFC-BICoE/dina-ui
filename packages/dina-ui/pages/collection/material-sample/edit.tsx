import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormSubmitParams,
  SubmitButton,
  TextField,
  useAccount,
  useQuery,
  withResponse
} from "common-ui";
import { useRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";

export default function MaterialSampleEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  const materialSampleQuery = useQuery<MaterialSample>(
    {
      path: `collection-api/material-sample/${id}?include=collectingEvent`
    },
    { disabled: !id }
  );

  async function moveToViewPage(savedId: string) {
    await router.push(`/collection/material-sample/view?id=${savedId}`);
  }

  const title = id ? "editMaterialSampleTitle" : "addMaterialSampleTitle";

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <div className="container-fluid">
        <h1>
          <DinaMessage id={title} />
        </h1>
        {id ? (
          withResponse(materialSampleQuery, ({ data }) => (
            <MaterialSampleForm
              materialSample={data}
              onSaved={moveToViewPage}
            />
          ))
        ) : (
          <MaterialSampleForm onSaved={moveToViewPage} />
        )}
      </div>
    </div>
  );
}

export interface MaterialSampleFormProps {
  materialSample?: MaterialSample;
  onSaved?: (id: string) => Promise<void>;
}

export function MaterialSampleForm({
  materialSample,
  onSaved
}: MaterialSampleFormProps) {
  const { username } = useAccount();

  /** YYYY-MM-DD format. */
  const todayDate = new Date().toISOString().slice(0, 10);

  const initialValues = materialSample
    ? { ...materialSample }
    : {
        name: `${username}-${todayDate}`
      };

  async function onSubmit({
    api: { save },
    submittedValues
  }: DinaFormSubmitParams<any>) {
    const materialSampleInput = { ...submittedValues };

    await save([], { apiBaseUrl: "/collection-api" });
  }

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={materialSample?.id}
        entityLink="/collection/material-sample"
      />
      <SubmitButton className="ml-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      {buttonBar}
      <div className="row">
        <TextField name="name" className="col-md-6" />
      </div>
      {buttonBar}
    </DinaForm>
  );
}
