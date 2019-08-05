import { FilterParam, KitsuResource } from "kitsu";
import React, { useRef, useState } from "react";
import ReactTable, {
  Column,
  PageSizeChangeFunction,
  SortedChangeFunction,
  SortingRule
} from "react-table";
import "react-table/react-table.css";
import titleCase from "title-case";
import { JsonApiQuerySpec, useQuery } from "..";
import { MetaWithTotal } from "../../types/seqdb-api/meta";
import { PageSpec } from "../../types/seqdb-api/page";

/** Object types accepted as a column definition. */
export type ColumnDefinition<TData> = string | Column<TData>;

/** QueryTable component's props. */
export interface QueryTableProps<TData extends KitsuResource> {
  /** JSONAPI resource path. */
  path: string;

  /** JSONAPI filter spec. */
  filter?: FilterParam;

  /** Related resources to include in the request. */
  include?: string;

  /** Default sort attribute. */
  defaultSort?: SortingRule[];

  /** Default page size. */
  defaultPageSize?: number;

  /** The columns to show in the table. */
  columns: Array<ColumnDefinition<TData>>;

  /** Called when a new page size is requested. */
  onPageSizeChange?: PageSizeChangeFunction;

  /** Called when a new sort is specified. */
  onSortedChange?: SortedChangeFunction;
}

const DEFAULT_PAGE_SIZE = 25;

const queryTableStyle = `
  /* Wraps long text instead of shortening it. */
  .rt-td {
    white-space: unset !important;
  }

  /*
   * Hides the page-jump input's spin button, which on this component would not
   * otherwise trigger a page jump.
   */
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
  }
  input[type=number] {
    -moz-appearance:textfield;
  }
`;

/**
 * Table component that fetches data from the backend API.
 */
export function QueryTable<TData extends KitsuResource>({
  columns,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  defaultSort = [],
  filter,
  include,
  onPageSizeChange,
  onSortedChange,
  path
}: QueryTableProps<TData>) {
  // JSONAPI sort attribute.
  const [sortingRules, setSortingRules] = useState(defaultSort);
  // JSONAPI page spec.
  const [page, setPage] = useState<PageSpec>({
    limit: defaultPageSize,
    offset: 0
  });

  const divWrapperRef = useRef<HTMLDivElement>();

  function onFetchData(reactTableState) {
    const { page: newPageNumber, sorted, pageSize } = reactTableState;

    const newOffset = newPageNumber * pageSize;

    // When a new page is requested and the top of the window is below the top of the table,
    // scroll to the top of the table.
    if (
      newOffset !== page.offset &&
      window.scrollY > divWrapperRef.current.offsetTop
    ) {
      window.scrollTo(0, divWrapperRef.current.offsetTop);
    }

    if (sorted.length) {
      setSortingRules(sorted);
    }
    setPage({
      limit: pageSize,
      offset: newOffset
    });
  }

  // Get the new sort order in JSONAPI format. e.g. "name,-description".
  const sort =
    sortingRules.map(({ desc, id }) => `${desc ? "-" : ""}${id}`).join() ||
    undefined;

  const query: JsonApiQuerySpec = { path, filter, include, page, sort };

  const mappedColumns = columns.map<Column>(column => {
    // The "columns" prop can be a string or a react-table Column type.
    if (typeof column === "string") {
      return {
        Header: titleCase(column),
        accessor: column
      };
    } else {
      return column;
    }
  });

  const { loading, response } = useQuery<TData[], MetaWithTotal>(query);

  const totalCount =
    response && response.meta && response.meta.totalResourceCount;

  const numberOfPages = totalCount
    ? Math.ceil(totalCount / page.limit)
    : undefined;

  return (
    <div className="query-table-wrapper" ref={divWrapperRef}>
      <style>{queryTableStyle}</style>
      <span>Total matched records: {totalCount}</span>
      <ReactTable
        className="-striped"
        columns={mappedColumns}
        data={response && response.data}
        defaultPageSize={page.limit}
        defaultSorted={sortingRules}
        loading={loading}
        manual={true}
        onFetchData={onFetchData}
        onPageSizeChange={onPageSizeChange}
        onSortedChange={onSortedChange}
        pages={numberOfPages}
        showPaginationTop={true}
      />
    </div>
  );
}
