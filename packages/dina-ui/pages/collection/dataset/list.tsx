import {
  ColumnDefinition,
  CreateButton,
  dateCell,
  FieldHeader,
  ListLayoutFilterType,
  ListPageLayout,
  SelectField
} from "common-ui";
import { PersistedResource } from "kitsu";
import { CSSProperties, useMemo } from "react";
import Link from "next/link";
import { groupCell, GroupSelectField } from "../../../components";
import { getDatasetTitle } from "../../../components/collection/dataset/datasetTitle";
import PageLayout from "../../../components/page/PageLayout";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { DATASET_TYPES, Dataset } from "../../../types/collection-api";

/** Attributes searched by the free-text search. */
const DATASET_FILTER_ATTRIBUTES = ["multilingualTitle", "datasetVersion"];

const DEFAULT_SORT = [{ id: "createdOn", desc: true }];

const DATASET_TYPE_OPTIONS = [
  { label: "<any>", value: undefined },
  ...DATASET_TYPES.map((value) => ({ label: value, value }))
];

/** Placeholder shown in the title column when a dataset has no title. */
const EMPTY_CELL = <span className="text-muted d-block text-center">—</span>;

/**
 * Builds the predicate applied to each dataset by the free-text search and the
 * group / dataset type dropdowns.
 *
 * Filtering is done in-memory: the full dataset list is loaded once and filtered
 * client-side, the same way /group/list filters its (similarly small) list.
 */
export function datasetFilterFn(
  filterForm: any,
  dataset: PersistedResource<Dataset>
): boolean {
  const searchText: string =
    filterForm?.filterBuilderModel?.value?.trim()?.toLowerCase() ?? "";
  const group: string | undefined = filterForm?.group || undefined;
  const datasetType: string | undefined = filterForm?.datasetType || undefined;

  // Case-insensitive search across the version and every language's title, so a
  // dataset can be found by its French title while the UI is in English.
  if (searchText) {
    const matchesText = [
      dataset.datasetVersion,
      ...(dataset.multilingualTitle?.titles?.map((pair) => pair.title) ?? [])
    ].some((text) => text?.toLowerCase().includes(searchText));
    if (!matchesText) {
      return false;
    }
  }

  if (group && dataset.group !== group) {
    return false;
  }

  if (datasetType && dataset.datasetType !== datasetType) {
    return false;
  }

  return true;
}

export default function DatasetListPage() {
  const { formatMessage, locale } = useDinaIntl();

  const datasetTableColumns: ColumnDefinition<Dataset>[] = useMemo(
    () => [
      {
        id: "title",
        header: () => <FieldHeader name="title" />,
        // The accessor makes the column sortable client-side (sorting is
        // in-memory on this page, like the filtering).
        accessorFn: (dataset) => getDatasetTitle(dataset, locale),
        cell: ({ row: { original }, getValue }) => (
          <Link href={`/collection/dataset/view?id=${original.id}`}>
            {getValue<string>() || EMPTY_CELL}
          </Link>
        )
      },
      "datasetType",
      "datasetVersion",
      groupCell("group"),
      "createdBy",
      dateCell("createdOn")
    ],
    [locale]
  );

  const queryTableProps = useMemo(
    () => ({
      columns: datasetTableColumns,
      path: "collection-api/dataset"
    }),
    [datasetTableColumns]
  );

  return (
    <PageLayout
      titleId="datasetListTitle"
      buttonBarContent={
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/collection/dataset" />
        </div>
      }
    >
      <ListPageLayout<Dataset>
        defaultSort={DEFAULT_SORT}
        id="dataset-list"
        filterType={ListLayoutFilterType.FREE_TEXT}
        filterAttributes={DATASET_FILTER_ATTRIBUTES}
        filterFormClassName="list-filter-panel"
        filterPlaceholder={formatMessage("datasetSearchPlaceholder")}
        liveSearch={true}
        enableInMemoryFilter={true}
        filterFn={datasetFilterFn}
        filterFormchildren={({ submitForm }) => (
          <div className="d-flex gap-3 flex-wrap">
            <div style={{ width: "230px" }}>
              <GroupSelectField
                onChange={() => setImmediate(submitForm)}
                name="group"
                showAnyOption={true}
              />
            </div>
            <div style={{ width: "230px" }}>
              <SelectField
                onChange={() => setImmediate(submitForm)}
                name="datasetType"
                label={formatMessage("field_datasetType")}
                options={DATASET_TYPE_OPTIONS}
              />
            </div>
          </div>
        )}
        queryTableProps={queryTableProps}
        wrapTable={(table) => (
          <div
            className="dina-list-table"
            style={{ "--cell-block-min-width": "4ch" } as CSSProperties}
          >
            {table}
          </div>
        )}
      />
    </PageLayout>
  );
}
