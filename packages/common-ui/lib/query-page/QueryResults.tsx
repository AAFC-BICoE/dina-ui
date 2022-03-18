import { KitsuResource, PersistedResource } from "kitsu";
import ReactTable, { Column, TableProps, SortingRule } from "react-table";
import { useIntl } from "react-intl";
import { ColumnDefinition, DefaultTBody } from "../table/QueryTable";
import {
  CheckBoxFieldProps,
  useGroupedCheckBoxes
} from "../formik-connected/GroupedCheckBoxFields";
import { useRef, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "./QueryPage";
import {
  LimitOffsetPageSpec,
  MetaWithTotal
} from "../api-client/operations-types";
import { CommonMessage } from "../intl/common-ui-intl";
import {
  BulkDeleteButton,
  BulkDeleteButtonProps,
  BulkEditButton
} from "../../lib/list-page-layout/bulk-buttons";
import { Tooltip } from "../tooltip/Tooltip";
import { FieldHeader } from "../field-header/FieldHeader";
import { JsonApiQuerySpec } from "../api-client/useQuery";
import {
  transformQueryToDSL,
  TransformQueryToDSLParams
} from "../util/transformToDSL";
import { SaveArgs, useApiClient } from "../api-client/ApiClientContext";
import { useEffect } from "react";
import { QueryRowExportProps } from "../query-builder/QueryRow";

export interface QueryResultsProp<TData extends KitsuResource> {
  /** API query specs to use if elastic search is not available. */
  fallbackQuery: JsonApiQuerySpec;

  /** Elastic search index name. */
  indexName: string;

  /** Search queries to be performed. */
  searchGroup?: string;
  searchQueries?: QueryRowExportProps[];

  /** Columns to display on the table. */
  columns: ColumnDefinition<TData>[];

  /** Used to set the default sort on the search results. */
  defaultSort?: SortingRule[];

  /** Display pagination */
  omitPaging?: boolean;

  /** Adds the bulk edit button and the row checkboxes. */
  bulkEditPath?: (ids: string[]) => {
    pathname: string;
    query: Record<string, string>;
  };

  /** Bulk delete button props. */
  bulkDeleteButtonProps?: BulkDeleteButtonProps;

  /** React table props that should be changed. */
  reactTableProps?:
    | Partial<TableProps>
    | ((
        responseData: PersistedResource<TData>[] | undefined,
        CheckBoxField: React.ComponentType<CheckBoxFieldProps<TData>>
      ) => Partial<TableProps>);

  /** Triggered when the sorting has been changed. */
  onSortedChange?: (newSort: SortingRule[]) => void;
}

export function QueryResults<TData extends KitsuResource>({
  fallbackQuery,
  indexName,
  searchGroup,
  searchQueries,
  columns,
  defaultSort,
  omitPaging,
  bulkDeleteButtonProps,
  reactTableProps,
  bulkEditPath,
  onSortedChange
}: QueryResultsProp<TData>) {
  const { formatMessage } = useIntl();
  const { apiClient } = useApiClient();

  // Table data
  const [data, setData] = useState<TData[]>([]);

  // Total number of records
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Table loading indicator state
  const [loading, setLoading] = useState<boolean>(true);

  // Table error states
  const [error, setError] = useState<any>();

  // Page size (or query limit)
  const [pageSize, setPageSize] = useState<number>(0);

  // JSONAPI sort attribute.
  const [sortingRules, setSortingRules] = useState(defaultSort);

  // Elastic search or fall back search.
  const [elasticSearch, setElasticSearch] = useState<boolean>(true);

  // Fetching Table Data Functions
  // ----------------------------------------------------------------------
  function onFetchData(reactTableStates) {
    setLoading(true);

    // Always default to elastic search until it's unavailable.
    if (elasticSearch) {
      performElasticSearch(reactTableStates);
    } else {
      performFallbackSearch(reactTableStates);
    }

    // Page limit state needs to be updated to properly calculate the total pages.
    setPageSize(reactTableStates.pageSize);

    setLoading(false);
  }

  function performElasticSearch(reactTableStates) {
    // Create Query DSL with pagination from react table.
    const queryDSL = transformQueryToDSL(
      {
        group: searchGroup,
        queryRows: searchQueries ?? []
      },
      {
        limit: reactTableStates.pageSize,
        offset: reactTableStates.page * reactTableStates.pageSize
      }
    );

    // No search when query has no content in it
    if (!Object.keys(queryDSL).length) return;
    searchES(queryDSL)
      .then(result => {
        const processedResult = result?.hits
          .map(hit => hit._source?.data)
          .map(rslt => ({
            id: rslt.id,
            type: rslt.type,
            ...rslt.attributes
          }));
        setAvailableSamples(processedResult);
        setData(processedResult);
        setTotalRecords(result?.total.value);
        setElasticSearch(true);
      })
      .catch(() => {
        // Try to use fallback search instead.
        performFallbackSearch(reactTableStates);
      });
  }

  async function searchES(queryDSL) {
    const query = { ...queryDSL };
    const resp = await apiClient.axios.post(
      `search-api/search-ws/search`,
      query,
      {
        params: {
          indexName
        }
      }
    );
    return resp?.data?.hits;
  }

  function performFallbackSearch(reactTableStates) {
    searchAPI(reactTableStates).then(result => {
      setData(result.data as TData[]);
      setTotalRecords(result.meta.totalResourceCount);
      setElasticSearch(false);
    });
  }

  async function searchAPI(reactTableStates) {
    const { path, ...getQuery } = fallbackQuery;
    const resp = await apiClient.get<TData[], MetaWithTotal>(path, {
      ...getQuery,
      page: {
        limit: reactTableStates.pageSize,
        offset: reactTableStates.page * reactTableStates.pageSize
      }
    });
    return resp;
  }

  // Checkbox Selection Setup
  // ----------------------------------------------------------------------
  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableSamples
  } = useGroupedCheckBoxes({
    fieldName: "selectedResources",
    defaultAvailableItems: data
  });

  const showRowCheckboxes = Boolean(bulkDeleteButtonProps || bulkEditPath);

  // Table Column Setup
  // ----------------------------------------------------------------------
  const combinedColumns = [
    ...(showRowCheckboxes
      ? [
          {
            Cell: ({ original: resource }) => (
              <CheckBoxField key={resource.id} resource={resource} />
            ),
            Header: CheckBoxHeader,
            sortable: false,
            width: 200
          }
        ]
      : []),
    ...columns
  ];

  const mappedColumns = combinedColumns.map<Column>(column => {
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

  // Computed React Table Props
  // ----------------------------------------------------------------------
  const computedReactTableProps =
    typeof reactTableProps === "function"
      ? reactTableProps(data as any, CheckBoxField)
      : reactTableProps;

  const resolvedReactTableProps = { sortingRules, ...computedReactTableProps };

  // Pagination Setup
  // ----------------------------------------------------------------------

  // Determine the total number of pages.
  const numberOfPages = totalRecords ? Math.ceil(totalRecords / pageSize) : 0;

  return (
    <div
      className="query-table-wrapper"
      role="search"
      aria-label={formatMessage({ id: "queryTable" })}
    >
      <div className="mb-1">
        {!omitPaging && (
          <div className="d-flex align-items-end">
            <span>
              <CommonMessage
                id="tableTotalCount"
                values={{ totalCount: totalRecords }}
              />
            </span>
            {resolvedReactTableProps?.sortable !== false && (
              <div className="flex-grow-1">
                <Tooltip
                  id="queryTableMultiSortExplanation"
                  visibleElement={
                    <a
                      href="#"
                      aria-describedby={"queryTableMultiSortExplanation"}
                    >
                      <CommonMessage id="queryTableMultiSortTooltipTitle" />
                    </a>
                  }
                />
              </div>
            )}
            <div className="d-flex gap-2">
              {bulkEditPath && <BulkEditButton bulkEditPath={bulkEditPath} />}
              {bulkDeleteButtonProps && (
                <BulkDeleteButton {...bulkDeleteButtonProps} />
              )}
            </div>
          </div>
        )}
      </div>
      <ReactTable
        className="-striped"
        columns={mappedColumns}
        data={data}
        minRows={1}
        {...resolvedReactTableProps}
        pageText={<CommonMessage id="page" />}
        noDataText={<CommonMessage id="noRowsFound" />}
        ofText={<CommonMessage id="of" />}
        rowsText={formatMessage({ id: "rows" })}
        previousText={<CommonMessage id="previous" />}
        nextText={<CommonMessage id="next" />}
        manual={true}
        loading={loading}
        pages={numberOfPages}
        onFetchData={onFetchData}
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
