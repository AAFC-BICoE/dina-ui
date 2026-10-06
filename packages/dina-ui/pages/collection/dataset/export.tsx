import {
  BackButton,
  FieldHeader,
  QueryPage,
  useQuery,
  withResponse
} from "common-ui";
import { useRouter } from "next/router";
import { TableColumn } from "../../../../common-ui/lib/list-page/types";
import { dynamicFieldMappingForMaterialSample } from "../material-sample/list";
import PageLayout from "../../../components/page/PageLayout";
import { DatasetExportForm } from "../../../components/collection/dataset/DatasetExportForm";
import {
  DatasetExportDefinition,
  getDatasetExportDefinition
} from "../../../components/collection/dataset/datasetExportDefinitions";
import { MaterialSample } from "../../../types/collection-api";
import { Dataset } from "../../../types/collection-api";

const MATERIAL_SAMPLE_EXPORT_COLUMNS: TableColumn<MaterialSample>[] = [
  {
    id: "materialSampleName",
    header: () => <FieldHeader name="materialSampleName" />,
    accessorKey: "data.attributes.materialSampleName",
    isKeyword: true
  }
];

export default function DatasetExportPage() {
  const router = useRouter();
  const datasetId = router.query.id?.toString();
  const datasetQuery = useQuery<Dataset>(
    { path: `collection-api/dataset/${datasetId}` },
    { disabled: !datasetId }
  );

  return (
    <PageLayout
      titleId="datasetExportPageTitle"
      buttonBarContent={
        datasetId ? (
          <div className="col-md-12 d-flex">
            <BackButton entityId={datasetId} entityLink="/collection/dataset" />
          </div>
        ) : undefined
      }
    >
      {withResponse(datasetQuery, ({ data }) => {
        const definition = getDatasetExportDefinition(data.datasetType);
        const exportTypeKey = definition.exportType.toLowerCase();

        return (
          <QueryPage
            indexName={definition.indexName}
            uniqueName={`dataset-export-${exportTypeKey}-${data.id}`}
            dynamicFieldMapping={dynamicFieldMappingForMaterialSample}
            columns={MATERIAL_SAMPLE_EXPORT_COLUMNS}
            resultsAside={({ query, totalRecords }) => (
              <section
                aria-labelledby="dataset-export-form-heading"
                className="dataset-export-aside"
              >
                <DatasetExportForm
                  dataset={data}
                  definition={definition as DatasetExportDefinition}
                  query={query}
                  totalRecords={totalRecords}
                />
              </section>
            )}
          />
        );
      })}
    </PageLayout>
  );
}
