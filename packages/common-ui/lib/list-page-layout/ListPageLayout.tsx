import { FilterParam, KitsuResource } from "kitsu";
import { useCookies } from "react-cookie";
import { CookieSetOptions } from "universal-cookie";
import { QueryTable, QueryTableProps } from "..";
import { rsql } from "../filter-builder/rsql";
import { FilterForm } from "./FilterForm";

interface ListPageLayoutProps<TData extends KitsuResource> {
  filterAttributes: string[];
  id: string;
  queryTableProps: QueryTableProps<TData>;
  WrapTable?: React.FunctionComponent;
}

const TABLE_PAGE_SIZE_COOKIE = "tablePageSize";
const TABLE_SORT_COOKIE = "tableSort";

/** The cookie should not expire. */
const COOKIE_OPTIONS: CookieSetOptions = { expires: new Date("3000-01-01") };

/**
 * Generic layout component for list pages. Renders a QueryTable with a filter builder.
 * The filter form state is hydrated from a cookie, and is saved in a cookie on form submit.
 */
export function ListPageLayout<TData extends KitsuResource>({
  filterAttributes,
  id,
  queryTableProps,
  WrapTable = ({ children }) => <>{children}</>
}: ListPageLayoutProps<TData>) {
  // Use a cookie hook to get the cookies, and re-render when the watched cookies are changed.
  const [cookies, setCookie] = useCookies([
    id,
    TABLE_PAGE_SIZE_COOKIE,
    TABLE_SORT_COOKIE
  ]);

  const filterForm = cookies[id] || {};

  // Default sort and page-size from the QueryTable. These are only used on the initial
  // QueryTable render, and are saved as cookies when the table's sort or page-size is changed.
  const defaultSort = cookies[TABLE_SORT_COOKIE];
  const defaultPageSize = cookies[TABLE_PAGE_SIZE_COOKIE];

  // Build the JSONAPI filter param to be sent to the back-end.
  const filterParam: FilterParam = {
    rsql: rsql(filterForm.filterBuilderModel)
  };

  return (
    <div>
      <FilterForm filterAttributes={filterAttributes} id={id} />
      <WrapTable>
        <QueryTable<TData>
          defaultPageSize={defaultPageSize}
          defaultSort={defaultSort}
          filter={filterParam}
          reactTableProps={{
            onPageSizeChange: newSize =>
              setCookie(TABLE_PAGE_SIZE_COOKIE, newSize, COOKIE_OPTIONS),
            onSortedChange: newSort =>
              setCookie(TABLE_SORT_COOKIE, newSort, COOKIE_OPTIONS)
          }}
          {...queryTableProps}
        />
      </WrapTable>
    </div>
  );
}
