import { FilterParam, KitsuResource, PersistedResource } from "kitsu";
import { useState, useMemo } from "react";
import { useIntl } from "react-intl";
import ReactTable, { Column, TableProps, SortingRule } from "react-table";
import { SaveArgs, useApiClient } from "../api-client/ApiClientContext";
import { FieldHeader } from "../field-header/FieldHeader";
import { DinaForm, DinaFormSection } from "../formik-connected/DinaForm";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { QueryBuilder } from "../query-builder/QueryBuilder";
import { ColumnDefinition, DefaultTBody } from "../table/QueryTable";
import {
  transformQueryToDSL,
  TransformQueryToDSLParams
} from "../util/transformToDSL";
import {
  BulkDeleteButton,
  BulkDeleteButtonProps,
  BulkEditButton
} from "../../lib/list-page-layout/bulk-buttons";
import { CommonMessage } from "../intl/common-ui-intl";
import { Tooltip } from "../tooltip/Tooltip";
import { useQuery, withResponse } from "../api-client/useQuery";
import {
  CheckBoxFieldProps,
  useGroupedCheckBoxes
} from "../formik-connected/GroupedCheckBoxFields";
import { ESIndexMapping } from "../query-builder/QueryRow";
import useSWR from "swr";
import { v4 as uuidv4 } from "uuid";
import { SavedSearch } from "./SavedSearch";
import { cloneDeep } from "lodash";
import { GroupSelectField } from "../../../dina-ui/components/group-select/GroupSelectField";
import { UserPreference } from "../../../dina-ui/types/user-api";
import { FormikButton, LimitOffsetPageSpec, useAccount } from "..";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { useEffect } from "react";

const DEFAULT_PAGE_SIZE = 25;

interface SearchResultData<TData extends KitsuResource> {
  results: TData[];
  total: number;
}

export interface QueryPageProps<TData extends KitsuResource> {
  columns: ColumnDefinition<TData>[];
  indexName: string;
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
export function QueryPage<TData extends KitsuResource>({
  indexName,
  columns,
  bulkDeleteButtonProps,
  bulkEditPath,
  omitPaging,
  reactTableProps,
  defaultSort,
  onSortedChange
}: QueryPageProps<TData>) {
  const { apiClient } = useApiClient();
  const { formatMessage } = useIntl();
  const { username, subject } = useAccount();
  const { groupNames } = useAccount();
  const showRowCheckboxes = Boolean(bulkDeleteButtonProps || bulkEditPath);

  // JSONAPI sort attribute.
  const [sortingRules, setSortingRules] = useState(defaultSort);

  // Search results with pagination applied.
  const [searchResults, setSearchResults] = useState<SearchResultData<TData>>({
    results: [],
    total: 0
  });

  // JSONAPI pagination specs
  const [pagination, setPagination] = useState<LimitOffsetPageSpec>({
    limit: DEFAULT_PAGE_SIZE,
    offset: 0
  });

  // Search filters to apply.
  const [searchFilters, setSearchFilters] = useState<TransformQueryToDSLParams>(
    {
      group: groupNames?.[0] ?? "",
      queryRows: [
        {
          fieldName: ""
        }
      ]
    }
  );

  // Saved search dropdown options
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([]);

  // Selected saved search for the saved search dropdown.
  const [selectedSavedSearch, setSelectedSavedSearch] = useState<string>("");

  // Fetch data if the pagination or search filters have changed.
  useEffect(() => {
    // Elastic search query with pagination settings.
    const queryDSL = transformQueryToDSL(pagination, cloneDeep(searchFilters));

    // Do not search when the query has no content. (It should at least have pagination.)
    if (!Object.keys(queryDSL).length) return;

    // Fetch data using elastic search.
    searchES(queryDSL).then(result => {
      const processedResult = result?.hits
        .map(hit => hit._source?.data)
        .map(rslt => ({
          id: rslt.id,
          type: rslt.type,
          ...rslt.attributes
        }));
      setAvailableSamples(processedResult);
      setSearchResults({
        results: processedResult,
        total: result?.total.value
      });
    });
  }, [pagination, searchFilters]);

  // Retrieve user preferences only once.
  useEffect(() => {
    // Retrieve user preferences...
    apiClient
      .get<UserPreference[]>("user-api/user-preference", {
        filter: {
          userId: subject as FilterParam
        },
        page: { limit: 1000 }
      })
      .then(response => {
        setUserPreferences(response.data);

        // If the user has a default search, use it.
        if (response.data?.[0]?.savedSearches?.[username as any].default) {
          setSelectedSavedSearch("default");
          setSearchFilters(
            response.data[0].savedSearches?.[username as any].default
          );
        }
      });
  }, [userPreferences]);

  /**
   * Asynchronous POST request for elastic search. Used to retrieve elastic search results against
   * the indexName in the prop.
   *
   * @param queryDSL query containing filters and pagination.
   * @returns Elastic search response.
   */
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

  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableSamples
  } = useGroupedCheckBoxes({
    fieldName: "selectedResources",
    defaultAvailableItems: searchResults.results ?? []
  });

  const computedReactTableProps =
    typeof reactTableProps === "function"
      ? reactTableProps(
          searchResults.results as PersistedResource<TData>[],
          CheckBoxField
        )
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

  /**
   * On search filter submit. This will also update the pagination to go back to the first page on
   * a new search.
   *
   * @param submittedValues search filter form values.
   */
  const onSubmit = ({ submittedValues }) => {
    setSearchFilters(submittedValues);
    setPagination({
      ...pagination,
      offset: 0
    });
  };

  /**
   * When the user changes the react-table page size, it will trigger this event.
   *
   * This method will update the pagination, and since we have a useEffect hook on the pagination
   * this will trigger a new search. This will update the pagination limit.
   *
   * @param newPageSize
   */
  function onPageSizeChange(newPageSize: number) {
    setPagination({
      offset: 0,
      limit: newPageSize
    });
  }

  /**
   * When the user changes the react-table page, it will trigger this event.
   *
   * This method will update the pagination, and since we have a useEffect hook on the pagination
   * this will trigger a new search. Using the page size we can determine the offset.
   *
   * For example:
   *    pageSize: 25
   *    newPage: 5
   *
   *    The offset would be 25 * 5 = 125.
   *
   * @param newPage
   */
  function onPageChange(newPage: number) {
    setPagination({
      ...pagination,
      offset: pagination.limit * newPage
    });
  }

  /**
   * When the saved search is loading data, we need to save the new loaded search and cause a
   * re-render.
   */
  function onSavedSearchLoad(savedSearchName, savedSearchData) {
    setSearchFilters(savedSearchData);
    setSelectedSavedSearch(savedSearchName);
  }

  const totalCount = searchResults.total;

  async function fetchQueryFieldsByIndex(searchIndexName) {
    const resp = await apiClient.axios.get("search-api/search-ws/mapping", {
      params: { indexName: searchIndexName }
    });

    const result: ESIndexMapping[] = [];

    // Read index attributes.
    resp.data.body?.attributes
      ?.filter(key => key.name !== "type")
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

    // Read relationship attributes.
    resp.data.body?.relationships?.map(relationship => {
      relationship?.attributes?.map(relationshipAttribute => {
        // This is the user-friendly label to display on the search dropdown.
        const attributeLabel = relationshipAttribute.path?.includes(".")
          ? relationshipAttribute.path.substring(
              relationshipAttribute.path.indexOf(".") + 1
            ) +
            "." +
            relationshipAttribute.name
          : relationshipAttribute.name;

        result.push({
          label: attributeLabel,
          value: relationship.path + "." + attributeLabel,
          type: relationshipAttribute.type,
          path: relationshipAttribute.path,
          parentName: relationship.value,
          parentPath: relationship.path
        });
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
    data,
    error,
    isValidating: loading
  } = useSWR<ESIndexMapping[], any>(
    [indexName, cacheId],
    fetchQueryFieldsByIndex,
    {
      shouldRetryOnError: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  const sortedData = data
    ?.sort((a, b) => a.label.localeCompare(b.label))
    .filter(prop => !prop.label.startsWith("group"));

  const initialSavedSearches = userPreferences?.[0]?.savedSearches?.[
    username as any
  ] as any;

  return (
    <DinaForm key={uuidv4()} initialValues={searchFilters} onSubmit={onSubmit}>
      <label
        style={{ fontSize: 20, fontFamily: "sans-serif", fontWeight: "bold" }}
      >
        <DinaMessage id="search" />
      </label>
      <QueryBuilder name="queryRows" esIndexMapping={sortedData} />
      <DinaFormSection horizontal={"flex"}>
        <GroupSelectField
          isMulti={true}
          name="group"
          className="col-md-4"
          onChange={(value, formik) => {
            const currentSubmittedValues = cloneDeep(formik.values);
            onSubmit({
              submittedValues: { ...currentSubmittedValues, group: value }
            });
          }}
        />
      </DinaFormSection>

      <div className="d-flex mb-3">
        <div className="flex-grow-1">
          <SavedSearch
            onSavedSearchLoad={onSavedSearchLoad}
            userPreferences={userPreferences}
            savedSearchNames={
              initialSavedSearches ? Object.keys(initialSavedSearches) : []
            }
            initialSavedSearches={initialSavedSearches}
            selectedSearch={selectedSavedSearch}
          />
        </div>
        <div>
          <SubmitButton>{formatMessage({ id: "search" })}</SubmitButton>
          <FormikButton className="btn btn-secondary mx-2" onClick={resetForm}>
            <DinaMessage id="resetFilters" />
          </FormikButton>
        </div>
      </div>
      <div
        className="query-table-wrapper"
        role="search"
        aria-label={formatMessage({ id: "queryTable" })}
      >
        <div className="mb-1">
          {!omitPaging && (
            <div className="d-flex align-items-end">
              <span id="queryPageCount">
                <CommonMessage id="tableTotalCount" values={{ totalCount }} />
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
              <div className="d-flex gap-3">
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
          data={searchResults.results}
          minRows={1}
          {...resolvedReactTableProps}
          pageText={<CommonMessage id="page" />}
          noDataText={<CommonMessage id="noRowsFound" />}
          ofText={<CommonMessage id="of" />}
          rowsText={formatMessage({ id: "rows" })}
          previousText={<CommonMessage id="previous" />}
          nextText={<CommonMessage id="next" />}
          // Pagination props
          manual={true}
          pageSize={pagination.limit}
          pages={totalCount ? Math.ceil(totalCount / pagination.limit) : 0}
          page={pagination.offset / pagination.limit}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
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
    </DinaForm>
  );
}
