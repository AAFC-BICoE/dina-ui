import {
  ColumnDef,
  ColumnFiltersState,
  SortingState
} from "@tanstack/react-table";
import { FieldsParam, FilterParam, KitsuResource, KitsuResponse } from "kitsu";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import {
  ClientSideJoinSpec,
  DEFAULT_PAGE_SIZE_OPTIONS,
  JsonApiQuerySpec,
  LimitOffsetPageSpec,
  MetaWithTotal,
  ReactTable,
  ReactTableProps,
  useColumnChooser,
  useQuery
} from "..";
import { QueryState } from "../api-client/useQuery";
import { FieldHeader } from "../field-header/FieldHeader";
import { CommonMessage } from "../intl/common-ui-intl";
import { Tooltip } from "../tooltip/Tooltip";
import { Table } from "@tanstack/react-table";

/**
 * Column props with extra props designed specifically for our application on top of it.
 *
 * If a type of string is provided, it should just create a ColumnDefinition with accessor only.
 */
export type ColumnDefinition<TData extends KitsuResource> =
  | (ColumnDef<TData> & ElasticSearchColumnProps & InternationalizationProps)
  | string;

export interface InternationalizationProps {
  /**
   * Key used to retrieve the label value from internationalization.
   */
  label?: string;
}

interface ElasticSearchColumnProps {
  /**
   * For elastic search operations, should .keyword appended to the accessor.
   */
  keyword?: boolean;

  /**
   * The relationship type the elastic search field is part of.
   */
  relationshipType?: string;
}

/** QueryTable component's props. */
export interface QueryTableProps<TData extends KitsuResource> {
  /** Dependencies: When the values in this array are changed, re-fetch the data. */
  deps?: any[];

  /** JSONAPI resource path. */
  path: string;

  /** JSONAPI fields param. */
  fields?: FieldsParam;

  /** JSONAPI filter spec. */
  filter?: FilterParam;

  /** Related resources to include in the request. */
  include?: string;

  /** Default sort attribute. */
  defaultSort?: SortingState;

  /** Default page size. */
  defaultPageSize?: number;

  pageSizeOptions?: number[];

  /** The columns to show in the table. */
  columns: ColumnDefinition<TData>[];

  /** Client-side joins across multiple back-end APIs. */
  joinSpecs?: ClientSideJoinSpec[];

  /** Overrides the inner loading state if set to true. */
  loading?: boolean;

  /** Omits the paging section of the query string for endpoints that don't support paging. */
  omitPaging?: boolean;

  /** Query success callback. */
  onSuccess?: (response: KitsuResponse<TData[], MetaWithTotal>) => void;

  onPageSizeChange?: (newSize: number) => void;

  onSortedChange?: (newSort: SortingState) => void;

  enableFilters?: boolean;
  defaultColumnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (newColumnFiltersState: ColumnFiltersState) => void;

  /**
   * Override internal react-table props.
   * Pass in either the props or a function that provides the props.
   */
  reactTableProps?:
    | Partial<ReactTableProps<TData>>
    | ((
        queryState: QueryState<TData[], MetaWithTotal>
      ) => Partial<ReactTableProps<TData>>);

  hideTopPagination?: boolean;

  topRightCorner?: ReactNode;

  ariaLabel?: string;

  enableColumnChooser?: boolean;
}

const DEFAULT_PAGE_SIZE = 25;
/**
 * Table component that fetches data from the backend API.
 */
export function QueryTable<TData extends KitsuResource>({
  columns,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  defaultSort = [],
  deps,
  fields,
  filter,
  include,
  joinSpecs,
  loading: loadingProp,
  omitPaging,
  onSuccess,
  onPageSizeChange,
  onSortedChange,
  path,
  hideTopPagination,
  reactTableProps,
  topRightCorner,
  ariaLabel,
  enableFilters = false,
  defaultColumnFilters = [],
  onColumnFiltersChange,
  enableColumnChooser
}: QueryTableProps<TData>) {
  const { formatMessage, formatNumber } = useIntl();

  // JSONAPI sort attribute.
  const [sortingRules, setSortingRules] = useState<SortingState>(defaultSort);

  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(defaultColumnFilters);

  if (pageSizeOptions.indexOf(defaultPageSize) < 0) {
    defaultPageSize = pageSizeOptions[0];
  }

  // JSONAPI page spec.
  const [page, setPage] = useState<LimitOffsetPageSpec>({
    limit: defaultPageSize,
    offset: 0
  });

  const divWrapperRef = useRef<HTMLDivElement>(null);
  const [reactTable, setReactTable] = useState<Table<TData>>();
  const [_columnSelectionCheckboxes, setColumnSelectionCheckboxes] =
    useState<JSX.Element>();
  const { columnSelector } = useColumnChooser({
    indexName: path,
    hideExportButton: true,
    reactTable
  });

  function onPageChangeInternal(pageNumber: number) {
    const newOffset = pageNumber * page.limit;
    // When a new page is requested and the top of the window is below the top of the table,
    // scroll to the top of the table.
    if (
      divWrapperRef.current &&
      newOffset !== page.offset &&
      window.scrollY > divWrapperRef.current.offsetTop
    ) {
      window.scrollTo(0, divWrapperRef.current.offsetTop);
    }
    setPage({ offset: newOffset, limit: page.limit });
    const tableProps: Partial<ReactTableProps<TData>> | undefined =
      typeof reactTableProps === "function"
        ? reactTableProps(queryState)
        : reactTableProps;
    tableProps?.onPageChange?.(pageNumber);
  }

  function onPageSizeChangeInternal(newSize: number) {
    const newOffset = 0;
    // When a new page is requested and the top of the window is below the top of the table,
    // scroll to the top of the table.
    if (
      divWrapperRef.current &&
      newOffset !== page.offset &&
      window.scrollY > divWrapperRef.current.offsetTop
    ) {
      window.scrollTo(0, divWrapperRef.current.offsetTop);
    }
    setPage({ offset: newOffset, limit: newSize });
    const tableProps: Partial<ReactTableProps<TData>> | undefined =
      typeof reactTableProps === "function"
        ? reactTableProps(queryState)
        : reactTableProps;
    tableProps?.onPageSizeChange?.(newSize);
    onPageSizeChange?.(newSize);
  }

  function onSortingChangeInternal(newSorting: SortingState) {
    onSortedChange?.(newSorting);
    setSortingRules(newSorting);
    const tableProps: Partial<ReactTableProps<TData>> | undefined =
      typeof reactTableProps === "function"
        ? reactTableProps(queryState)
        : reactTableProps;
    tableProps?.onSortingChange?.(newSorting);
  }

  function onColumnFiltersChangeInternal(
    newColumnFiltersState: ColumnFiltersState
  ) {
    onColumnFiltersChange?.(newColumnFiltersState);
    setColumnFilters(newColumnFiltersState);
    const tableProps: Partial<ReactTableProps<TData>> | undefined =
      typeof reactTableProps === "function"
        ? reactTableProps(queryState)
        : reactTableProps;
    tableProps?.onColumnFiltersChange?.(newColumnFiltersState);
  }

  // Get the new sort order in JSONAPI format. e.g. "name,-description".
  const sort =
    sortingRules.map(({ desc, id }) => `${desc ? "-" : ""}${id}`).join() ||
    undefined;

  const query: JsonApiQuerySpec = {
    path,
    fields,
    filter,
    include,
    ...(!omitPaging && { page }),
    sort
  };

  const mappedColumns: ColumnDef<TData>[] = columns.map((column) => {
    // The "columns" prop can be a string or a react-table Column type.
    const header = () => {
      if (typeof column === "string") {
        return <FieldHeader name={column} />;
      } else if (column.header) {
        return column.header;
      } else if ((column as any).accessorKey) {
        return <FieldHeader name={(column as any).accessorKey} />;
      } else {
        return <FieldHeader name={""} />;
      }
    };

    const mappedColumnDef: ColumnDef<TData> = {
      header,
      ...(typeof column === "string" ? { accessorKey: column } : { ...column })
    };
    return mappedColumnDef;
  });

  const queryState = useQuery<TData[], MetaWithTotal>(query, {
    deps,
    joinSpecs,
    onSuccess
  });

  const { error, loading: queryIsLoading, response } = queryState;

  const lastSuccessfulResponse =
    useRef<KitsuResponse<TData[], MetaWithTotal>>();

  if (response) {
    lastSuccessfulResponse.current = response;
  }

  const totalCount =
    lastSuccessfulResponse.current?.meta?.totalResourceCount ?? 0;

  const numberOfPages = totalCount
    ? Math.ceil(totalCount / page.limit)
    : undefined;

  const resolvedReactTableProps =
    typeof reactTableProps === "function"
      ? reactTableProps(queryState)
      : reactTableProps;

  // Show the last loaded page while loading the next page:
  const displayData = lastSuccessfulResponse.current?.data;
  const shouldShowPagination = !!displayData?.length;

  // Auto set aria label for react table using part of path
  let autoAriaLabel = path
    .substring(path.lastIndexOf("/") ? path.lastIndexOf("/") + 1 : 0)
    .replaceAll("-", " ");

  autoAriaLabel = autoAriaLabel.endsWith("s")
    ? autoAriaLabel + "es"
    : autoAriaLabel + "s";

  useEffect(() => {
    const reactTableDivs = document?.querySelectorAll<any>(
      "div.rt-table[role='grid']"
    );
    reactTableDivs?.forEach((element) => {
      element.setAttribute("aria-label", ariaLabel ?? autoAriaLabel);
    });
  });

  return (
    <div
      className="query-table-wrapper"
      ref={divWrapperRef}
      role="search"
      aria-label={formatMessage({ id: "queryTable" })}
    >
      <div className="d-flex align-items-end mb-1">
        {!omitPaging && (
          <span>
            <CommonMessage
              id="tableTotalCount"
              values={{ totalCount: formatNumber(totalCount) }}
            />
          </span>
        )}
        <div className="ms-auto">
          <div>
            {enableColumnChooser && columnSelector}
            {topRightCorner}
          </div>

          {resolvedReactTableProps?.enableSorting !== false && (
            <Tooltip id="queryTableMultiSortExplanation" placement="left" />
          )}
        </div>
      </div>
      <ReactTable<TData>
        className="-striped"
        columns={mappedColumns}
        data={(displayData as TData[]) ?? []}
        defaultSorted={sortingRules}
        loading={loadingProp || queryIsLoading}
        enableFilters={enableFilters}
        defaultColumnFilters={defaultColumnFilters}
        manualFiltering={true}
        onColumnFiltersChange={onColumnFiltersChangeInternal}
        manualPagination={true}
        enableSorting={true}
        enableMultiSort={true}
        manualSorting={true}
        pageCount={numberOfPages}
        showPaginationTop={shouldShowPagination && !hideTopPagination}
        showPagination={shouldShowPagination}
        onPageSizeChange={onPageSizeChangeInternal}
        onPageChange={onPageChangeInternal}
        onSortingChange={onSortingChangeInternal}
        pageSizeOptions={pageSizeOptions}
        setColumnSelectionCheckboxes={setColumnSelectionCheckboxes}
        setReactTable={setReactTable}
        {...resolvedReactTableProps}
        TbodyComponent={
          error
            ? () => (
                <div
                  className="alert alert-danger"
                  style={{
                    whiteSpace: "pre-line"
                  }}
                >
                  <p>
                    {error.errors?.map((e) => e.detail).join("\n") ??
                      String(error)}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const newSort = [{ id: "createdOn", desc: true }];
                      onSortingChangeInternal(newSort);
                    }}
                  >
                    <CommonMessage id="resetSort" />
                  </button>
                </div>
              )
            : resolvedReactTableProps?.TbodyComponent
        }
      />
    </div>
  );
}
