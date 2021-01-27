import { useLocalStorage } from "@rehooks/local-storage";
import { FormikProps } from "formik";
import { FilterParam, KitsuResource } from "kitsu";
import { Fragment } from "react";
import { SortingRule } from "react-table";
import { FilterAttribute, QueryTable, QueryTableProps } from "..";
import { rsql } from "../filter-builder/rsql";
import { FilterForm } from "./FilterForm";

interface ListPageLayoutProps<TData extends KitsuResource> {
  additionalFilters?: FilterParam | ((filterForm: any) => FilterParam);
  defaultSort?: SortingRule[];
  filterAttributes?: FilterAttribute[];
  filterFormchildren?: (formik: FormikProps<any>) => React.ReactElement;
  id: string;
  queryTableProps: QueryTableProps<TData>;
  WrapTable?: React.ComponentType;
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
  WrapTable = Fragment
}: ListPageLayoutProps<TData>) {
  const tablePageSizeKey = `${id}_tablePageSize`;
  const tableSortKey = `${id}_tableSort`;
  const filterformKey = `${id}_filterForm`;

  // Use a localStorage hook to get the filter form state,
  // and re-render when the watched localStorage key is changed.
  const [filterForm, setFilterForm] = useLocalStorage<any>(filterformKey, {});

  // Default sort and page-size from the QueryTable. These are only used on the initial
  // QueryTable render, and are saved in localStorage when the table's sort or page-size is changed.
  const [storedDefaultSort, setStoredDefaultSort] = useLocalStorage<
    SortingRule[]
  >(tableSortKey);
  const defaultSort = storedDefaultSort ?? defaultSortProp;

  const [defaultPageSize, setDefaultPageSize] = useLocalStorage<number>(
    tablePageSizeKey
  );

  let filterBuilderRsql = "";
  try {
    filterBuilderRsql = rsql(filterForm.filterBuilderModel);
  } catch (error) {
    // If there is an error, ignore the filter form rsql instead of crashing the page.
    // tslint:disable-next-line
    console.error(error);
    setImmediate(() => setFilterForm({}));
  }

  const additionalFilters = (typeof additionalFiltersProp === "function"
    ? additionalFiltersProp(filterForm)
    : additionalFiltersProp) as Record<string, string>;

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

  return (
    <div>
      {filterAttributes && (
        <FilterForm filterAttributes={filterAttributes} id={id}>
          {filterFormchildren}
        </FilterForm>
      )}
      <WrapTable>
        <QueryTable<TData>
          defaultPageSize={defaultPageSize ?? undefined}
          defaultSort={defaultSort ?? undefined}
          filter={filterParam}
          onPageSizeChange={newSize => setDefaultPageSize(newSize)}
          onSortedChange={newSort => setStoredDefaultSort(newSort)}
          {...queryTableProps}
        />
      </WrapTable>
    </div>
  );
}
