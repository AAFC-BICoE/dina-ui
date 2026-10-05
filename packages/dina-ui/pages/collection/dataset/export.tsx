import {
  BackButton,
  FieldHeader,
  ListViewTab,
  QueryPage,
  QueryPageTabConfig,
  QueryPageTabProps,
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

function DatasetExportTab(props: QueryPageTabProps<MaterialSample>) {
  return (
    <DatasetExportForm
      dataset={props.dataset as Dataset}
      definition={props.definition as DatasetExportDefinition}
      query={props.query}
    />
  );
}

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
        const tabs: QueryPageTabConfig<MaterialSample>[] = [
          {
            id: "list",
            labelKey: "listView",
            component: ListViewTab
          },
          {
            id: `${exportTypeKey}-export`,
            labelKey: "exportButtonText",
            showActionButtons: false,
            component: DatasetExportTab,
            config: { dataset: data, definition }
          }
        ];

        return (
          <QueryPage
            indexName={definition.indexName}
            uniqueName={`dataset-export-${exportTypeKey}-${data.id}`}
            dynamicFieldMapping={dynamicFieldMappingForMaterialSample}
            columns={MATERIAL_SAMPLE_EXPORT_COLUMNS}
            tabs={tabs}
            defaultTab="list"
          />
        );
      })}
    </PageLayout>
  );
}
