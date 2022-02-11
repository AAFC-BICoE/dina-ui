import { KitsuResource } from "kitsu";
import { useState, useMemo } from "react";
import { useIntl } from "react-intl";
import ReactTable, { Column, TableProps } from "react-table";
import { useApiClient } from "../api-client/ApiClientContext";
import { FieldHeader } from "../field-header/FieldHeader";
import { DinaForm } from "../formik-connected/DinaForm";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { QueryBuilder } from "../query-builder/QueryBuilder";
import { ColumnDefinition } from "../table/QueryTable";
import { transformQueryToDSL } from "../util/transformToDSL";
import {
  BulkDeleteButton,
  BulkDeleteButtonProps,
  BulkEditButton
} from "../../lib/list-page-layout/bulk-buttons";
import { CommonMessage } from "../intl/common-ui-intl";
import { Tooltip } from "../tooltip/Tooltip";
import { MetaWithTotal } from "../api-client/operations-types";
import { QueryState } from "../api-client/useQuery";
import { useGroupedCheckBoxes } from "../formik-connected/GroupedCheckBoxFields";
import { ESIndexMapping } from "../query-builder/QueryRow";
import useSWR from "swr";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import { SavedSearch } from "./SavedSearch";
import { FieldWrapper } from "../formik-connected/FieldWrapper";
import { JsonObject, JsonValue } from "type-fest";
import { useAccount } from "..";
import useLocalStorage from "@rehooks/local-storage";
import { get } from "lodash";

export interface QueryPageProps<TData extends KitsuResource> {
  columns: ColumnDefinition<TData>[];
  indexName: string;
  initData?: TData[];
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
    | ((queryState: QueryState<TData[], MetaWithTotal>) => Partial<TableProps>);
}
export function QueryPage<TData extends KitsuResource>({
  indexName,
  columns,
  initData,
  bulkDeleteButtonProps,
  bulkEditPath,
  omitPaging,
  reactTableProps
}: QueryPageProps<TData>) {
  const { apiClient } = useApiClient();
  const { formatMessage } = useIntl();
  const [initSavedSearchValues, setInitSavedSearchValues] = useState<
    JsonObject[]
  >([]);
  const { username } = useAccount();
  const SAVED_SEARCHES = "saved-searches";
  const [savedSearches, setSavedSearches] =
    useLocalStorage<Map<string, JsonValue>>(SAVED_SEARCHES);

  const [searchResults, setSearchResults] = useState<{
    results?: TData[];
    isFromSearch?: boolean;
  }>({});
  const showRowCheckboxes = Boolean(bulkDeleteButtonProps || bulkEditPath);
  const [visible, setVisible] = useState(false);

  const resolvedReactTableProps = { sortable: true, ...reactTableProps };

  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableSamples
  } = useGroupedCheckBoxes({
    fieldName: "selectedResources",
    defaultAvailableItems: searchResults?.isFromSearch
      ? searchResults?.results
      : initData
  });

  const savedEsIndexMapping =
    initSavedSearchValues && initSavedSearchValues.length > 0
      ? (initSavedSearchValues as any).filter(initVal =>
          get(initVal, "props.esIndexMapping")
        )?.[0]?.props?.esIndexMapping
      : undefined;

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
    return resp?.data?.hits.hits.map(hit => hit._source?.data);
  }

  const onSubmit = ({ submittedValues }) => {
    const queryDSL = transformQueryToDSL(submittedValues.queryRows);
    // No search when query has no content in it
    if (!Object.keys(queryDSL).length) return;
    searchES(queryDSL).then(result => {
      const processedResult = result?.map(rslt => ({
        id: rslt.id,
        type: rslt.type,
        ...rslt.attributes
      }));
      setAvailableSamples(processedResult);
      setSearchResults({ results: processedResult, isFromSearch: true });
    });
  };
  const totalCount = searchResults?.results?.length ?? initData?.length;

  async function fetchQueryFieldsByIndex(searchIndexName) {
    const resp = await apiClient.axios.get("search-api/search-ws/mapping", {
      params: { indexName: searchIndexName }
    });

    const result: ESIndexMapping[] = [];

    Object.keys(resp.data)
      .filter(key => key.includes("data.attributes."))
      .map(key => {
        const fieldNameLabel = key.substring("data.attributes.".length);
        result.push({
          label: fieldNameLabel,
          value: key,
          type: resp.data?.[key]
        });
      });
    return result;
  }

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
      revalidateOnReconnect: false,
      suspense: !!savedEsIndexMapping
    }
  );

  if (loading || error) return <></>;

  function loadSavedSearch(savedSearchName) {
    setInitSavedSearchValues(
      savedSearches ? savedSearches[username as any]?.[savedSearchName] : [{}]
    );
  }

  function saveSearch(value, isDefault, searchName) {
    let newSavedSearches;
    if (savedSearches && Object.keys(savedSearches)?.length > 0) {
      savedSearches[username as any][`${isDefault ? "default" : searchName}`] =
        value;
    } else {
      newSavedSearches = {
        [`${username}`]: { [`${isDefault ? "default" : searchName}`]: value }
      };
    }
    setSavedSearches(
      savedSearches ?? (newSavedSearches as Map<string, JsonValue>)
    );
  }

  function deleteSavedSearch(savedSearchName?: string) {
    // todo
  }

  function onChange(e) {
    // todo
  }

  return (
    <DinaForm
      key={uuidv4()}
      initialValues={
        initSavedSearchValues && initSavedSearchValues.length > 0
          ? { queryRows: initSavedSearchValues }
          : {
              queryRows: [{}]
            }
      }
      onSubmit={onSubmit}
    >
      <label
        style={{ fontSize: 20, fontFamily: "sans-serif", fontWeight: "bold" }}
      >
        {" "}
        {formatMessage({ id: "search" })}
      </label>
      <QueryBuilder
        name="queryRows"
        esIndexMapping={savedEsIndexMapping ?? data}
      />
      <div className="d-flex justify-content-end mb-3">
        <SubmitButton>{formatMessage({ id: "search" })}</SubmitButton>
      </div>

      <FieldWrapper name="queryRows" hideLabel={true}>
        {({ value }) => (
          <SavedSearch
            loadSavedSearch={loadSavedSearch}
            value={value}
            deleteSavedSearch={deleteSavedSearch}
            saveSearch={saveSearch}
            savedSearchNames={
              savedSearches?.[username as any]
                ? Object.keys(savedSearches?.[username as any])
                : []
            }
          />
        )}
      </FieldWrapper>

      <div
        className="query-table-wrapper"
        role="search"
        aria-label={formatMessage({ id: "queryTable" })}
      >
        <div className="mb-1">
          {!omitPaging && (
            <div className="d-flex ">
              <span>
                <CommonMessage id="tableTotalCount" values={{ totalCount }} />
              </span>
              {resolvedReactTableProps?.sortable !== false && (
                <span className="flex-grow-1">
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
              <div className="">
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
          data={searchResults?.results ?? initData}
          minRows={1}
        />
      </div>
    </DinaForm>
  );
}
