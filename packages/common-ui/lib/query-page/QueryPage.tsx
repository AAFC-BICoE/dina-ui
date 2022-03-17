import { FilterParam, KitsuResource, PersistedResource } from "kitsu";
import React, { useState, useMemo, useRef } from "react";
import { useIntl } from "react-intl";
import ReactTable, { Column, TableProps, SortingRule } from "react-table";
import { SaveArgs, useApiClient } from "../api-client/ApiClientContext";
import { FieldHeader } from "../field-header/FieldHeader";
import { DinaForm, DinaFormSection } from "../formik-connected/DinaForm";
import { QueryBuilder } from "../query-builder/QueryBuilder";
import { ColumnDefinition, DefaultTBody } from "../table/QueryTable";
import { transformQueryToDSL } from "../util/transformToDSL";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import {
  BulkDeleteButton,
  BulkDeleteButtonProps,
  BulkEditButton
} from "../../lib/list-page-layout/bulk-buttons";
import { CommonMessage } from "../intl/common-ui-intl";
import { Tooltip } from "../tooltip/Tooltip";
import {
  JsonApiQuerySpec,
  useQuery,
  withResponse
} from "../api-client/useQuery";
import {
  CheckBoxFieldProps,
  useGroupedCheckBoxes
} from "../formik-connected/GroupedCheckBoxFields";
import { ESIndexMapping } from "../query-builder/QueryRow";
import useSWR from "swr";
import { v4 as uuidv4 } from "uuid";
import { SavedSearch } from "./SavedSearch";
import { JsonValue } from "type-fest";
import { cloneDeep, toPairs } from "lodash";
import { GroupSelectField } from "../../../dina-ui/components/group-select/GroupSelectField";
import { UserPreference } from "../../../dina-ui/types/user-api";
import {
  AreYouSureModal,
  FormikButton,
  useAccount,
  useModal,
  Pagination,
  MetaWithTotal
} from "..";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { FormikProps } from "formik";
import { useEffect } from "react";
import { DocWithErrors } from "jsonapi-typescript";
import { SubmitButton } from "../formik-connected/SubmitButton";

export interface QueryPageProps<TData extends KitsuResource> {
  columns: ColumnDefinition<TData>[];
  indexName: string;

  fallbackQuery: JsonApiQuerySpec;

  defaultSort?: SortingRule[];
  /** Adds the bulk edit button and the row checkboxes. */
  bulkEditPath?: (ids: string[]) => {
    pathname: string;
    query: Record<string, string>;
  };
  /** Adds the bulk delete button and the row checkboxes. */
  bulkDeleteButtonProps?: BulkDeleteButtonProps;
  omitPaging?: boolean;
  reactTableProps?:
    | Partial<TableProps>
    | ((
        responseData: PersistedResource<TData>[] | undefined,
        CheckBoxField: React.ComponentType<CheckBoxFieldProps<TData>>
      ) => Partial<TableProps>);

  onSortedChange?: (newSort: SortingRule[]) => void;
}

interface TableData<TData extends KitsuResource> {
  data?: TData[];
  totalRecords?: number;
  pagination: Pagination;
  error?: DocWithErrors | undefined;
  loading: boolean;
  elasticSearch: boolean;
}

/**
 * Default size for QueryTable.
 */
export const DEFAULT_PAGE_SIZE = 25;

export function QueryPage<TData extends KitsuResource>({
  indexName,
  columns,
  fallbackQuery,
  bulkDeleteButtonProps,
  bulkEditPath,
  omitPaging,
  reactTableProps,
  defaultSort,
  onSortedChange
}: QueryPageProps<TData>) {
  const { apiClient, save } = useApiClient();
  const { formatMessage } = useIntl();
  const { openModal } = useModal();
  const pageRef = useRef<FormikProps<any>>(null);
  // Initial saved search values for the user with its saved search names as keys
  const [initSavedSearchValues, setInitSavedSearchValues] =
    useState<Map<string, JsonValue[]>>();
  const { username, subject } = useAccount();
  const { groupNames } = useAccount();
  // JSONAPI sort attribute.
  const [sortingRules, setSortingRules] = useState(defaultSort);
  const showRowCheckboxes = Boolean(bulkDeleteButtonProps || bulkEditPath);

  // Setup default table data
  const [tableData, setTableData] = useState<TableData<TData>>({
    pagination: {
      currentPage: 0,
      limit: DEFAULT_PAGE_SIZE,
      offset: 0
    },
    elasticSearch: true,
    loading: true
  });

  // Setup default search query
  const [searchQueries, setSearchQueries] = useState<any>({
    group: groupNames?.[0],
    queryRows: [{}]
  });

  function performSearch() {
    // Set the table into a loading state...
    setTableData({
      ...tableData,
      loading: true,
      data: undefined,
      totalRecords: undefined,
      error: undefined
    });

    if (tableData.elasticSearch) {
      performElasticSearch();
    } else {
      performFallbackSearch();
    }
  }

  function performElasticSearch() {
    const queryDSL = transformQueryToDSL(searchQueries, tableData?.pagination);
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

        setTableData({
          ...tableData,
          elasticSearch: true,
          data: processedResult as TData[],
          totalRecords: result?.total.value,
          loading: false,
          error: undefined
        });
      })
      .catch(error => {
        // Report the error to the tableData reference.
        setTableData({
          ...tableData,
          elasticSearch: false,
          data: undefined,
          totalRecords: undefined,
          loading: true,
          error
        });

        // Try to use fallback search instead.
        performFallbackSearch();
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

  function performFallbackSearch() {
    searchAPI()
      .then(result => {
        setTableData({
          ...tableData,
          elasticSearch: false,
          data: result.data as TData[],
          totalRecords: result.meta.totalResourceCount,
          loading: false,
          error: undefined
        });
      })
      .catch(error => {
        setTableData({
          ...tableData,
          elasticSearch: false,
          data: undefined,
          totalRecords: undefined,
          loading: false,
          error
        });
      });
  }

  async function searchAPI() {
    const { path, ...getQuery } = fallbackQuery;
    const resp = await apiClient.get<TData[], MetaWithTotal>(path, {
      ...getQuery,
      page: {
        limit: tableData.pagination.limit,
        offset: tableData.pagination.offset
      }
    });
    return resp;
  }

  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableSamples
  } = useGroupedCheckBoxes({
    fieldName: "selectedResources",
    defaultAvailableItems: tableData?.data
  });

  const computedReactTableProps =
    typeof reactTableProps === "function"
      ? reactTableProps(tableData?.data as any, CheckBoxField)
      : reactTableProps;

  const resolvedReactTableProps = { sortingRules, ...computedReactTableProps };

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

  function resetForm(_, formik) {
    const resetToVal = {
      queryRows: [{}],
      group: groupNames?.[0]
    };
    formik?.setValues(resetToVal);
    onSubmit({ submittedValues: resetToVal });
  }

  const onSubmit = ({ submittedValues }) => {
    setSearchQueries(submittedValues);
  };

  // Perform a search if the pagination is different or a new search query.
  useEffect(() => {
    performSearch();
  }, [tableData.pagination, searchQueries]);

  /**
   * Triggered when the user changes the page. This will also determine the offset to apply to the
   * elasticsearch.
   *
   * @param newPageNumber The new page number set.
   */
  const onPageChange = (newPageNumber: number) => {
    setTableData({
      ...tableData,
      pagination: {
        ...tableData.pagination,
        offset: newPageNumber * tableData.pagination.limit,
        currentPage: newPageNumber
      }
    });
  };

  /**
   * Triggered when the user changes the number of records to display on a page. This will also
   * change the number of records retrieved from elasticsearch.
   *
   * @param newPageSize Number of records to display on page.
   */
  const onPageSizeChange = (newPageSize: number) => {
    setTableData({
      ...tableData,
      pagination: {
        offset: 0,
        limit: newPageSize,
        currentPage: 0
      }
    });
  };

  const numberOfPages = tableData?.totalRecords
    ? Math.ceil(tableData?.totalRecords / tableData.pagination.limit)
    : 0;

  async function fetchQueryFieldsByIndex(searchIndexName) {
    const resp = await apiClient.axios.get("search-api/search-ws/mapping", {
      params: { indexName: searchIndexName }
    });

    const result: ESIndexMapping[] = [];

    resp.data.body.attributes
      .filter(key => key.name !== "type")
      .map(key => {
        const path = key.path;
        const prefix = "data.attributes";
        let attrPrefix;
        if (path && path.includes(prefix)) {
          attrPrefix = path.substring(prefix.length + 1);
        }
        result.push({
          label: attrPrefix ? attrPrefix + "." + key.name : key.name,
          value: key.path
            ? key.path + "." + key.name
            : key.name === "id"
            ? "data." + key.name
            : key.name,
          type: key.type,
          path: key.path
        });
      });

    resp.data.body.relationships.attributes
      .filter(key => key.name !== "type")
      .map(key => {
        result.push({
          label: key.path?.includes(".")
            ? key.path.substring(key.path.indexOf(".") + 1) + "." + key.name
            : key.name,
          value: key.path
            ? key.path + "." + key.name
            : key.name === "id"
            ? "data." + key.name
            : key.name,
          type: key.type,
          path: key.path,
          parentPath: resp.data.body.relationships.path,
          parentName: resp.data.body.relationships.value
        });
      });
    return result;
  }

  const savedSearchQuery = useQuery<UserPreference[]>({
    path: "user-api/user-preference",
    filter: {
      userId: subject as FilterParam
    },
    page: { limit: 1000 }
  });

  // Invalidate the query cache on query change, don't use SWR's built-in cache:
  const cacheId = useMemo(() => uuidv4(), []);

  const {
    data: indexData,
    error: indexError,
    isValidating: indexLoading
  } = useSWR<ESIndexMapping[], any>(
    [indexName, cacheId],
    fetchQueryFieldsByIndex,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  if (tableData.elasticSearch === undefined) {
    performElasticSearch();
  }

  function loadSavedSearch(savedSearchName, userPreferences) {
    const initValus = new Map().set(
      savedSearchName,
      userPreferences
        ? userPreferences[0]?.savedSearches?.[username as any]?.[
            savedSearchName
          ]
        : [{}]
    );

    setSearchQueries(initValus);
  }

  async function saveSearch(isDefault, userPreferences, searchName) {
    let newSavedSearches;
    const mySavedSearches = userPreferences;

    if (
      mySavedSearches &&
      mySavedSearches?.[0]?.savedSearches &&
      Object.keys(mySavedSearches?.[0]?.savedSearches)?.length > 0
    ) {
      // Remove irrelevent formik field array properties before save
      pageRef.current?.values.queryRows?.map(val => {
        delete val.props;
        delete val.key;
        delete val._store;
        delete val._owner;
        delete val.ref;
      });
      mySavedSearches[0].savedSearches[username as any][
        `${isDefault ? "default" : searchName}`
      ] = pageRef.current?.values;
    } else {
      newSavedSearches = {
        [`${username}`]: {
          [`${isDefault ? "default" : searchName}`]: pageRef.current?.values
        }
      };
    }
    const saveArgs: SaveArgs<UserPreference> = {
      resource: {
        id: userPreferences?.[0]?.id,
        userId: subject,
        savedSearches:
          mySavedSearches?.[0]?.savedSearches ??
          (newSavedSearches as Map<string, JsonValue>)
      } as any,
      type: "user-preference"
    };
    await save([saveArgs], { apiBaseUrl: "/user-api" });
    loadSavedSearch(isDefault ? "default" : searchName, userPreferences);
  }

  async function deleteSavedSearch(
    savedSearchName: string,
    userPreferences: UserPreference[]
  ) {
    async function deleteSearch() {
      const userSavedSearches =
        userPreferences[0]?.savedSearches?.[username as any];
      delete userSavedSearches?.[`${savedSearchName}`];

      const saveArgs: SaveArgs<UserPreference> = {
        resource: {
          id: userPreferences?.[0]?.id,
          userId: subject,
          savedSearches: userPreferences?.[0]?.savedSearches
        } as any,
        type: "user-preference"
      };

      await save([saveArgs], { apiBaseUrl: "/user-api" });
      loadSavedSearch(toPairs(userSavedSearches)?.[0]?.[0], userPreferences);
    }

    openModal(
      <AreYouSureModal
        actionMessage={
          <>
            <DinaMessage id="removeSavedSearch" /> {`${savedSearchName ?? ""}`}{" "}
          </>
        }
        onYesButtonClicked={deleteSearch}
      />
    );
  }

  const sortedData = indexData
    ?.sort((a, b) => a.label.localeCompare(b.label))
    .filter(prop => !prop.label.startsWith("group"));

  return (
    <DinaForm
      key={uuidv4()}
      innerRef={pageRef}
      initialValues={searchQueries}
      onSubmit={onSubmit}
    >
      <label
        style={{ fontSize: 20, fontFamily: "sans-serif", fontWeight: "bold" }}
      >
        <DinaMessage id="search" />
      </label>

      {/* Search Query Section */}
      {indexLoading ? (
        <>
          <LoadingSpinner loading={true} />
          <br />
        </>
      ) : (
        <>
          {/* Search Query Error */}
          {indexError ? (
            <div
              className="alert alert-danger"
              style={{
                whiteSpace: "pre-line"
              }}
            >
              <p className="mb-0">{String(indexError)}</p>
            </div>
          ) : (
            <>
              <QueryBuilder name="queryRows" esIndexMapping={sortedData} />
              <DinaFormSection horizontal={"flex"}>
                <GroupSelectField
                  name="group"
                  className="col-md-4"
                  onChange={(value, formik) => {
                    const resetToVal = cloneDeep(formik.values);
                    onSubmit({
                      submittedValues: { ...resetToVal, group: value }
                    });
                  }}
                />
              </DinaFormSection>

              <div className="d-flex mb-3">
                <div className="flex-grow-1">
                  {withResponse(
                    savedSearchQuery,
                    ({ data: userPreferences }) => {
                      const initialSavedSearches = userPreferences?.[0]
                        ?.savedSearches?.[username as any] as any;
                      return (
                        <SavedSearch
                          userPreferences={userPreferences}
                          loadSavedSearch={loadSavedSearch}
                          deleteSavedSearch={deleteSavedSearch}
                          saveSearch={saveSearch}
                          savedSearchNames={
                            initialSavedSearches
                              ? Object.keys(initialSavedSearches)
                              : []
                          }
                          initialSavedSearches={initialSavedSearches}
                          selectedSearch={
                            initSavedSearchValues
                              ? initSavedSearchValues.keys().next().value
                              : undefined
                          }
                        />
                      );
                    }
                  )}
                </div>
                <div>
                  <FormikButton
                    className="btn btn-primary px-5"
                    onClick={() => {
                      // New searches should set the pagination.
                      setTableData({
                        ...tableData,
                        pagination: {
                          ...tableData.pagination,
                          currentPage: 0,
                          offset: 0
                        }
                      });

                      // Submit form.
                      pageRef.current?.submitForm();
                    }}
                  >
                    <DinaMessage id="search" />
                  </FormikButton>
                  <FormikButton
                    className="btn btn-secondary mx-2"
                    onClick={resetForm}
                  >
                    <DinaMessage id="resetFilters" />
                  </FormikButton>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Table Data */}
      {tableData.loading ? (
        <LoadingSpinner loading={true} />
      ) : (
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
                    values={{ totalCount: tableData?.totalRecords }}
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
                  {bulkEditPath && (
                    <BulkEditButton bulkEditPath={bulkEditPath} />
                  )}
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
            data={tableData.data}
            minRows={1}
            {...resolvedReactTableProps}
            pageText={<CommonMessage id="page" />}
            noDataText={<CommonMessage id="noRowsFound" />}
            ofText={<CommonMessage id="of" />}
            rowsText={formatMessage({ id: "rows" })}
            previousText={<CommonMessage id="previous" />}
            nextText={<CommonMessage id="next" />}
            manual={true}
            pageSize={tableData.pagination.limit}
            pages={numberOfPages}
            page={tableData.pagination.currentPage}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            TbodyComponent={
              tableData?.error
                ? () => (
                    <div
                      className="alert alert-danger"
                      style={{
                        whiteSpace: "pre-line"
                      }}
                    >
                      <p>
                        {tableData?.error?.errors
                          ?.map(e => e.detail)
                          .join("\n") ?? String(tableData?.error)}
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
      )}
    </DinaForm>
  );
}
