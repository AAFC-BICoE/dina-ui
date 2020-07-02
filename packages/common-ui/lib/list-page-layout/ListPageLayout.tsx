import { useLocalStorage } from "@rehooks/local-storage";
import { FormikProps } from "formik";
import { FilterParam, KitsuResource } from "kitsu";
import { SortingRule } from "react-table";
import { QueryTable, QueryTableProps } from "..";
import { rsql } from "../filter-builder/rsql";
import { FilterForm } from "./FilterForm";

interface ListPageLayoutProps<TData extends KitsuResource> {
  additionalFilters?: FilterParam | ((filterForm: any) => FilterParam);
  filterAttributes: string[];
  filterFormchildren?: (formik: FormikProps<any>) => React.ReactElement;
  id: string;
  queryTableProps: QueryTableProps<TData>;
  WrapTable?: React.FunctionComponent;
}

/**
 * Generic layout component for list pages. Renders a QueryTable with a filter builder.
 * The filter form state is hydrated from localstorage, and is saved in localstorage on form submit.
 */
export function ListPageLayout<TData extends KitsuResource>({
  additionalFilters: additionalFiltersProp,
  filterAttributes,
  filterFormchildren,
  id,
  queryTableProps,
  WrapTable = ({ children }) => <>{children}</>
}: ListPageLayoutProps<TData>) {
  const tablePageSizeKey = `${id}_tablePageSize`;
  const tableSortKey = `${id}_tableSort`;
  const filterformKey = `${id}_filterForm`;

  // Use a localStorage hook to get the filter form state,
  // and re-render when the watched localStorage key is changed.
  const [filterForm] = useLocalStorage<any>(filterformKey, {});

  // Default sort and page-size from the QueryTable. These are only used on the initial
  // QueryTable render, and are saved in localStorage when the table's sort or page-size is changed.
  const [defaultSort, setDefaultSort] = useLocalStorage<SortingRule[]>(
    tableSortKey
  );
  const [defaultPageSize, setDefaultPageSize] = useLocalStorage<number>(
    tablePageSizeKey
  );

  const filterBuilderRsql = rsql(filterForm.filterBuilderModel);

  const additionalFilters =
    typeof additionalFiltersProp === "function"
      ? additionalFiltersProp(filterForm)
      : additionalFiltersProp;

  // Combine the inner rsql with the passed additionalFilters?.rsql filter if they are set:
  const combinedRsql = [
    ...(filterBuilderRsql ? [filterBuilderRsql] : []),
    ...(additionalFilters?.rsql ? [additionalFilters?.rsql] : [])
  ].join(" and ");

  // Build the JSONAPI filter param to be sent to the back-end.
  const filterParam: FilterParam = {
    ...additionalFilters,
    rsql: combinedRsql
  };

  return (
    <div>
      <FilterForm filterAttributes={filterAttributes} id={id}>
        {filterFormchildren}
      </FilterForm>
      <WrapTable>
        <QueryTable<TData>
          defaultPageSize={defaultPageSize ?? undefined}
          defaultSort={defaultSort ?? undefined}
          filter={filterParam}
          reactTableProps={{
            onPageSizeChange: newSize => setDefaultPageSize(newSize),
            onSortedChange: newSort => setDefaultSort(newSort)
          }}
          {...queryTableProps}
        />
      </WrapTable>
    </div>
  );
}
