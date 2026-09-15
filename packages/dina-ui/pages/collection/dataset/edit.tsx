import {
  BackButton,
  DinaForm,
  DinaFormOnSubmit,
  RefSubmitButton,
  useApiClient,
  useQuery,
  withResponse
} from "common-ui";
import { FormikProps } from "formik";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { useRef } from "react";
import {
  convertDatasetToFormData,
  convertFormDataToDataset,
  DatasetFormValues,
  DatasetWithLicense
} from "../../../components/collection/dataset/datasetFormConverter";
import { DatasetFormLayout } from "../../../components/collection/dataset/DatasetFormLayout";
import PageLayout from "../../../components/page/PageLayout";
import { Dataset } from "../../../types/collection-api";
import { License } from "../../../types/objectstore-api";

interface DatasetFormProps {
  fetchedDataset?: DatasetWithLicense;
  onSaved: (dataset: PersistedResource<Dataset>) => Promise<void>;
  formRef?: React.RefObject<FormikProps<DatasetFormValues> | null>;
}

export default function DatasetEditPage() {
  const { apiClient } = useApiClient();
  const router = useRouter();
  const id = router.query.id?.toString();
  const formRef = useRef<FormikProps<DatasetFormValues>>(null);

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

  const buttonBarContent = (
    <>
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton entityId={id} entityLink="/collection/dataset" />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <RefSubmitButton formRef={formRef} className="ms-auto" />
      </div>
    </>
  );

  return (
    <PageLayout titleId={title} buttonBarContent={buttonBarContent}>
      <div>
        {id ? (
          withResponse(query, ({ data }) => (
            <DatasetForm
              fetchedDataset={data}
              onSaved={goToViewPage}
              formRef={formRef}
            />
          ))
        ) : (
          <DatasetForm onSaved={goToViewPage} formRef={formRef} />
        )}
      </div>
    </PageLayout>
  );
}

export function DatasetForm({
  fetchedDataset,
  onSaved,
  formRef
}: DatasetFormProps) {
  const { save } = useApiClient();
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
      innerRef={formRef}
    >
      <DatasetFormLayout />
    </DinaForm>
  );
}
