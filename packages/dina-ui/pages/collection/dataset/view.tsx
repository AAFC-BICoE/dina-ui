import { DinaForm, EditButton } from "common-ui";
import Link from "next/link";
import { ViewPageLayout } from "../../../components";
import { DatasetFormLayout } from "../../../components/collection/dataset/DatasetFormLayout";
import { getDatasetTitle } from "../../../components/collection/dataset/datasetTitle";
import {
  convertDatasetToFormData,
  DatasetFormValues
} from "../../../components/collection/dataset/datasetFormConverter";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Dataset } from "../../../types/collection-api";

export default function DatasetDetailsPage() {
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
      editButton={({ initialValues }) => (
        <>
          <Link
            href={`/collection/dataset/export?id=${initialValues.id}`}
            className="btn btn-primary"
          >
            <DinaMessage id="datasetExportButtonText" />
          </Link>
          <EditButton
            entityId={initialValues.id}
            entityLink="/collection/dataset"
          />
        </>
      )}
      type="dataset"
      apiBaseUrl="/collection-api"
    />
  );
}
