import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../../components";
import { DatasetFormLayout } from "../../../components/collection/dataset/DatasetFormLayout";
import { getDatasetTitle } from "../../../components/collection/dataset/datasetTitle";
import {
  DatasetFormValues,
  useDatasetFormConverter
} from "../../../components/collection/dataset/useDatasetFormConverter";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { Dataset } from "../../../types/collection-api";

export default function DatasetDetailsPage() {
  const { convertDatasetToFormData } = useDatasetFormConverter();
  const { locale } = useDinaIntl();

  return (
    <ViewPageLayout<Dataset>
      form={(props) => (
        <DinaForm<DatasetFormValues>
          {...props}
          initialValues={convertDatasetToFormData(props.initialValues)}
        >
          <DatasetFormLayout />
        </DinaForm>
      )}
      query={(id) => ({ path: `collection-api/dataset/${id}` })}
      nameField={(dataset) => getDatasetTitle(dataset, locale)}
      entityLink="/collection/dataset"
      type="dataset"
      apiBaseUrl="/collection-api"
      showRevisionsLink={true}
    />
  );
}
