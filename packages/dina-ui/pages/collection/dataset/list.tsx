import {
  ColumnDefinition,
  CreateButton,
  dateCell,
  ListPageLayout,
  SimpleSearchFilterBuilder
} from "common-ui";
import Link from "next/link";
import { groupCell, GroupSelectField } from "../../../components";
import { getDatasetTitle } from "../../../components/collection/dataset/datasetTitle";
import PageLayout from "../../../components/page/PageLayout";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { Dataset } from "../../../types/collection-api";

const DATASET_FILTER_ATTRIBUTES = ["datasetVersion"];

export default function DatasetListPage() {
  const { locale } = useDinaIntl();

  const DATASET_TABLE_COLUMNS: ColumnDefinition<Dataset>[] = [
    {
      id: "multilingualTitle",
      cell: ({ row: { original } }) => (
        <Link href={`/collection/dataset/view?id=${original.id}`}>
          {getDatasetTitle(original, locale)}
        </Link>
      ),
      accessorKey: "multilingualTitle",
      enableSorting: false
    },
    "datasetType",
    "datasetVersion",
    groupCell("group"),
    "createdBy",
    dateCell("createdOn")
  ];

  return (
    <PageLayout
      titleId="datasetListTitle"
      buttonBarContent={
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/collection/dataset" />
        </div>
      }
    >
      <ListPageLayout
        additionalFilters={(filterForm) =>
          SimpleSearchFilterBuilder.create<Dataset>()
            .whereProvided("group", "EQ", filterForm.group)
            .build()
        }
        filterAttributes={DATASET_FILTER_ATTRIBUTES}
        id="dataset-list"
        queryTableProps={{
          columns: DATASET_TABLE_COLUMNS,
          path: "collection-api/dataset",
          defaultSort: [{ id: "createdOn", desc: true }]
        }}
        filterFormchildren={({ submitForm }) => (
          <div className="mb-3">
            <div style={{ width: "300px" }}>
              <GroupSelectField
                onChange={() => setImmediate(submitForm)}
                name="group"
                showAnyOption={true}
              />
            </div>
          </div>
        )}
      />
    </PageLayout>
  );
}
