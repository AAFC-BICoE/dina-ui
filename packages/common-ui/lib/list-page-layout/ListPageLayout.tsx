import { useLocalStorage } from "@rehooks/local-storage";
import { FormikProps } from "formik";
import { FilterParam, KitsuResource, KitsuResponse } from "kitsu";
import { ReactNode } from "react";
import { SortingRule } from "react-table";
import {
  DinaForm,
  FilterAttribute,
  MetaWithTotal,
  QueryTable,
  QueryTableProps,
  useGroupedCheckBoxes
} from "..";
import { rsql } from "../filter-builder/rsql";
import {
  BulkDeleteButton,
  BulkDeleteButtonProps,
  BulkEditButton
} from "./bulk-buttons";
import { FilterForm } from "./FilterForm";

export interface ListPageLayoutProps<TData extends KitsuResource> {
  additionalFilters?: FilterParam | ((filterForm: any) => FilterParam);
  defaultSort?: SortingRule[];
  filterAttributes?: FilterAttribute[];
  filterFormchildren?: (formik: FormikProps<any>) => React.ReactElement;
  id: string;
  queryTableProps: QueryTableProps<TData>;
  wrapTable?: (children: ReactNode) => ReactNode;

  /** Adds the bulk edit button and the row checkboxes. */
  bulkEditPath?: (ids: string[]) => {
    pathname: string;
    query: Record<string, string>;
  };
  /** Adds the bulk delete button and the row checkboxes. */
  bulkDeleteButtonProps?: BulkDeleteButtonProps;
}

/**
 * Generic layout component for list pages. Renders a QueryTable with a filter builder.
 * The filter form state is hydrated from localstorage, and is saved in localstorage on form submit.
 */
export function ListPageLayout<TData extends KitsuResource>({
  additionalFilters: additionalFiltersProp,
  defaultSort: defaultSortProp,
  filterAttributes,
  filterFormchildren,
  id,
  queryTableProps,
  wrapTable = children => children,
  bulkDeleteButtonProps,
  bulkEditPath
}: ListPageLayoutProps<TData>) {
  const tablePageSizeKey = `${id}_tablePageSize`;
  const tableSortKey = `${id}_tableSort`;
  const filterformKey = `${id}_filterForm`;

  // Use a localStorage hook to get the filter form state,
  // and re-render when the watched localStorage key is changed.
  const [filterForm, setFilterForm] = useLocalStorage<any>(filterformKey, {});

  // Default sort and page-size from the QueryTable. These are only used on the initial
  // QueryTable render, and are saved in localStorage when the table's sort or page-size is changed.
  const [storedDefaultSort, setStoredDefaultSort] =
    useLocalStorage<SortingRule[]>(tableSortKey);
  const defaultSort = storedDefaultSort ??
    defaultSortProp ?? [{ id: "createdOn", desc: true }];

  const [defaultPageSize, setDefaultPageSize] =
    useLocalStorage<number>(tablePageSizeKey);

  let filterBuilderRsql = "";
  try {
    filterBuilderRsql = rsql(filterForm.filterBuilderModel);
  } catch (error) {
    // If there is an error, ignore the filter form rsql instead of crashing the page.
    // tslint:disable-next-line
    console.error(error);
    setImmediate(() => setFilterForm({}));
  }

  const additionalFilters = (
    typeof additionalFiltersProp === "function"
      ? additionalFiltersProp(filterForm)
      : additionalFiltersProp
  ) as Record<string, string>;

  // Combine the inner rsql with the passed additionalFilters?.rsql filter if they are set:
  const combinedRsql = [
    ...(filterBuilderRsql ? [filterBuilderRsql] : []),
    ...(additionalFilters?.rsql ? [additionalFilters?.rsql] : [])
  ].join(" and ");

  // Build the JSONAPI filter param to be sent to the back-end.
  const filterParam: FilterParam = {
    ...additionalFilters,
    // Only include rsql if it's not blank:
    ...(combinedRsql && { rsql: combinedRsql })
  };

  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableSamples
  } = useGroupedCheckBoxes({
    fieldName: "selectedResources"
  });

  const showRowCheckboxes = Boolean(bulkDeleteButtonProps || bulkEditPath);

  const columns = [
    ...(showRowCheckboxes
      ? [
          {
            Cell: ({ original: resource }) => (
              <CheckBoxField key={resource.id} resource={resource} />
            ),
            Header: CheckBoxHeader,
            sortable: false
          }
        ]
      : []),
    ...queryTableProps.columns
  ];

  async function onSuccess(response: KitsuResponse<TData[], MetaWithTotal>) {
    setAvailableSamples(response.data);
    return queryTableProps.onSuccess?.(response);
  }

  const tableElement = (
    <QueryTable<TData>
      defaultPageSize={defaultPageSize ?? undefined}
      defaultSort={defaultSort ?? undefined}
      filter={filterParam}
      onPageSizeChange={newSize => setDefaultPageSize(newSize)}
      onSortedChange={newSort => setStoredDefaultSort(newSort)}
      {...queryTableProps}
      columns={columns}
      onSuccess={onSuccess}
    />
  );

  /** Wrap the table in a form when checkboxes are enabled. */
  const tableWrappedInForm = showRowCheckboxes ? (
    <DinaForm<BulkSelectableFormValues>
      initialValues={{ selectedResources: {} }}
    >
      <div className="d-flex justify-content-end">
        {bulkEditPath && <BulkEditButton bulkEditPath={bulkEditPath} />}
        {bulkDeleteButtonProps && (
          <BulkDeleteButton {...bulkDeleteButtonProps} />
        )}
      </div>
      {tableElement}
    </DinaForm>
  ) : (
    tableElement
  );

  return (
    <div>
      {filterAttributes && (
        <FilterForm filterAttributes={filterAttributes} id={id}>
          {filterFormchildren}
        </FilterForm>
      )}
      {wrapTable(tableWrappedInForm)}
    </div>
  );
}

export interface BulkSelectableFormValues {
  selectedResources: Record<string, boolean>;
}
