import { DinaForm, EditButton } from "common-ui";
import { useState } from "react";
import { ViewPageLayout } from "../../../components";
import { DatasetExportButton } from "../../../components/collection/dataset/DatasetExportButton";
import { DatasetFormLayout } from "../../../components/collection/dataset/DatasetFormLayout";
import { getDatasetTitle } from "../../../components/collection/dataset/datasetTitle";
import {
  convertDatasetToFormData,
  DatasetFormValues
} from "../../../components/collection/dataset/datasetFormConverter";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { Dataset } from "../../../types/collection-api";

export default function DatasetDetailsPage() {
  const { locale } = useDinaIntl();
  // Version saved by the export button. Applied locally because refetching would unmount the export popup.
  const [savedVersion, setSavedVersion] = useState<string>();

  return (
    <ViewPageLayout<Dataset>
      form={(props) => (
        <DinaForm<DatasetFormValues>
          {...props}
          // DinaForm doesn't reinitialize, so remount it when the version changes:
          key={props.initialValues.datasetVersion}
          initialValues={convertDatasetToFormData(props.initialValues)}
        >
          <DatasetFormLayout />
        </DinaForm>
      )}
      query={(id) => ({ path: `collection-api/dataset/${id}` })}
      alterInitialValues={(dataset) =>
        savedVersion ? { ...dataset, datasetVersion: savedVersion } : dataset
      }
      nameField={(dataset) => getDatasetTitle(dataset, locale)}
      entityLink="/collection/dataset"
      editButton={({ initialValues }) => (
        <>
          <DatasetExportButton
            dataset={initialValues}
            onVersionSaved={setSavedVersion}
          />
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
