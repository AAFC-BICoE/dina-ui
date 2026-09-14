import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  useApiClient,
  useQuery,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import {
  DatasetFormValues,
  DatasetWithLicense,
  useDatasetFormConverter
} from "../../../components/collection/dataset/useDatasetFormConverter";
import { DatasetFormLayout } from "../../../components/collection/dataset/DatasetFormLayout";
import PageLayout from "../../../components/page/PageLayout";
import { Dataset } from "../../../types/collection-api";
import { License } from "../../../types/objectstore-api";

interface DatasetFormProps {
  fetchedDataset?: DatasetWithLicense;
  onSaved: (dataset: PersistedResource<Dataset>) => Promise<void>;
}

export default function DatasetEditPage() {
  const { apiClient } = useApiClient();
  const router = useRouter();
  const {
    query: { id }
  } = router;

  async function goToViewPage(dataset: PersistedResource<Dataset>) {
    await router.push(`/collection/dataset/view?id=${dataset.id}`);
  }

  const title = id ? "editDatasetTitle" : "addDatasetTitle";

  const query = useQuery<DatasetWithLicense>(
    { path: `collection-api/dataset/${id}` },
    {
      disabled: !id,
      onSuccess: async ({ data: dataset }) => {
        // Resolve the License resource so the dropdown shows the stored licence:
        const url = dataset.usageRights?.licenseUrl;
        if (url) {
          dataset.license = (
            await apiClient.get<License[]>("objectstore-api/license", {
              filter: { url }
            })
          ).data[0];
        }
      }
    }
  );

  return (
    <PageLayout titleId={title}>
      <div>
        {id ? (
          withResponse(query, ({ data }) => (
            <DatasetForm fetchedDataset={data} onSaved={goToViewPage} />
          ))
        ) : (
          <DatasetForm onSaved={goToViewPage} />
        )}
      </div>
    </PageLayout>
  );
}

export function DatasetForm({ fetchedDataset, onSaved }: DatasetFormProps) {
  const { save } = useApiClient();
  const { convertDatasetToFormData, convertFormDataToDataset } =
    useDatasetFormConverter();

  const initialValues = convertDatasetToFormData(fetchedDataset);

  const onSubmit: DinaFormOnSubmit<DatasetFormValues> = async ({
    submittedValues
  }) => {
    const input = convertFormDataToDataset(submittedValues);

    const [savedDataset] = await save<Dataset>(
      [{ resource: input, type: "dataset" }],
      { apiBaseUrl: "/collection-api" }
    );
    await onSaved(savedDataset);
  };

  return (
    <DinaForm<DatasetFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar className="mb-4">
        <div className="col-md-6 col-sm-12 mt-2">
          <BackButton
            entityId={fetchedDataset?.id}
            entityLink="/collection/dataset"
          />
        </div>
        <div className="col-md-6 col-sm-12 d-flex">
          <SubmitButton className="ms-auto" />
        </div>
      </ButtonBar>
      <DatasetFormLayout />
    </DinaForm>
  );
}
