import { FieldsParam, FilterParam, KitsuResource, KitsuResponse } from "kitsu";
import { isPlainObject } from "lodash";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import ReactTable, { Column, SortingRule, TableProps } from "react-table";
import {
  ClientSideJoinSpec,
  JsonApiQuerySpec,
  LimitOffsetPageSpec,
  MetaWithTotal,
  useQuery
} from "..";
import { QueryState } from "../api-client/useQuery";
import { FieldHeader } from "../field-header/FieldHeader";
import { CommonMessage } from "../intl/common-ui-intl";
import { Tooltip } from "../tooltip/Tooltip";

/** Object types accepted as a column definition. */
export type ColumnDefinition<TData> = string | Column<TData>;

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
  defaultSort?: SortingRule[];

  /** Default page size. */
  defaultPageSize?: number;

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

  onSortedChange?: (newSort: SortingRule[]) => void;

  /**
   * Override internal react-table props.
   * Pass in either the props or a function that provides the props.
   */
  reactTableProps?:
    | Partial<TableProps>
    | ((queryState: QueryState<TData[], MetaWithTotal>) => Partial<TableProps>);

  hideTopPagination?: boolean;

  topRightCorner?: ReactNode;

  ariaLabel?: string;
}

const DEFAULT_PAGE_SIZE = 25;

/**
 * Table component that fetches data from the backend API.
 */
export function QueryTable<TData extends KitsuResource>({
  columns,
  defaultPageSize = DEFAULT_PAGE_SIZE,
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
  ariaLabel
}: QueryTableProps<TData>) {
  const { formatMessage } = useIntl();

  // JSONAPI sort attribute.
  const [sortingRules, setSortingRules] = useState(defaultSort);
  // JSONAPI page spec.
  const [page, setPage] = useState<LimitOffsetPageSpec>({
    limit: defaultPageSize,
    offset: 0
  });

  const divWrapperRef = useRef<HTMLDivElement>(null);

  function onFetchData(reactTableState) {
    const { page: newPageNumber, sorted, pageSize } = reactTableState;

    const newOffset = newPageNumber * pageSize;

    // When a new page is requested and the top of the window is below the top of the table,
    // scroll to the top of the table.
    if (
      divWrapperRef.current &&
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

  const query: JsonApiQuerySpec = {
    path,
    fields,
    filter,
    include,
    ...(!omitPaging && { page }),
    sort
  };

  const mappedColumns = columns.map<Column>(column => {
    // The "columns" prop can be a string or a react-table Column type.
    const { fieldName, customHeader } =
      typeof column === "string"
        ? {
            customHeader: undefined,
            fieldName: column
          }
        : {
            customHeader: column.Header,
            fieldName: String(column.accessor)
          };

    const Header = customHeader ?? <FieldHeader name={fieldName} />;

    return {
      Header,
      ...(typeof column === "string" ? { accessor: column } : { ...column })
    };
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

  const totalCount = lastSuccessfulResponse.current?.meta?.totalResourceCount;

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

  const [visible, setVisible] = useState(false);

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
    reactTableDivs?.forEach(element => {
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
          <>
            <span>
              <CommonMessage id="tableTotalCount" values={{ totalCount }} />
            </span>
            {resolvedReactTableProps?.sortable !== false && (
              <span className="mx-3">
                <Tooltip
                  id="queryTableMultiSortExplanation"
                  setVisible={setVisible}
                  visible={visible}
                  visibleElement={
                    <a
                      href="#"
                      aria-describedby={"queryTableMultiSortExplanation"}
                      onKeyUp={e =>
                        e.key === "Escape"
                          ? setVisible(false)
                          : setVisible(true)
                      }
                      onMouseOver={() => setVisible(true)}
                      onMouseOut={() => setVisible(false)}
                      onBlur={() => setVisible(false)}
                    >
                      <CommonMessage id="queryTableMultiSortTooltipTitle" />
                    </a>
                  }
                />
              </span>
            )}
          </>
        )}
        {topRightCorner && <div className="ms-auto">{topRightCorner}</div>}
      </div>
      <ReactTable
        FilterComponent={({ filter: headerFilter, onChange }) => (
          <input
            className="w-100"
            placeholder="Search..."
            value={headerFilter ? headerFilter.value : ""}
            onChange={event => onChange(event.target.value)}
          />
        )}
        TdComponent={DefaultTd}
        className="-striped"
        columns={mappedColumns}
        data={displayData}
        defaultPageSize={page.limit}
        defaultSorted={sortingRules}
        loading={loadingProp || queryIsLoading}
        manual={true}
        minRows={1}
        onFetchData={onFetchData}
        pageSizeOptions={[25, 50, 100, 200, 500]}
        pages={numberOfPages}
        showPaginationTop={shouldShowPagination && !hideTopPagination}
        showPaginationBottom={shouldShowPagination}
        noDataText={<CommonMessage id="noRowsFound" />}
        ofText={<CommonMessage id="of" />}
        onPageSizeChange={onPageSizeChange}
        onSortedChange={onSortedChange}
        rowsText={formatMessage({ id: "rows" })}
        previousText={<CommonMessage id="previous" />}
        nextText={<CommonMessage id="next" />}
        showPagination={!omitPaging && shouldShowPagination}
        {...resolvedReactTableProps}
        pageText={<CommonMessage id="page" />}
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
                    {error.errors?.map(e => e.detail).join("\n") ??
                      String(error)}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const newSort = [{ id: "createdOn", desc: true }];
                      onSortedChange?.(newSort);
                      setSortingRules(newSort);
                    }}
                  >
                    <CommonMessage id="resetSort" />
                  </button>
                </div>
              )
            : resolvedReactTableProps?.TbodyComponent ?? DefaultTBody
        }
      />
    </div>
  );
}

function DefaultTBody(props) {
  return <div {...props} className="rt-tbody" />;
}

export function DefaultTd({ className, style, children, onClick }) {
  // If children is not a renderable child, stringify it to make it renderable:
  const content =
    isPlainObject(children) && !children.props
      ? JSON.stringify(children)
      : children;

  return (
    <div
      className={`${className} rt-td`}
      onClick={onClick}
      // Wraps long text instead of shortening it.
      style={{ ...style, whiteSpace: "unset" }}
      // Hovering over the cell should show the value next to the cursor:
      title={typeof children === "string" ? children : undefined}
      role="cell"
    >
      {content}
    </div>
  );
}
