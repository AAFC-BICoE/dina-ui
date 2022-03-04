import { FilterParam, KitsuResource, PersistedResource } from "kitsu";
import { useState, useMemo, useRef } from "react";
import { useIntl } from "react-intl";
import ReactTable, { Column, TableProps, SortingRule } from "react-table";
import { SaveArgs, useApiClient } from "../api-client/ApiClientContext";
import { FieldHeader } from "../field-header/FieldHeader";
import { DinaForm, DinaFormSection } from "../formik-connected/DinaForm";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { QueryBuilder } from "../query-builder/QueryBuilder";
import { ColumnDefinition, DefaultTBody } from "../table/QueryTable";
import { transformQueryToDSL } from "../util/transformToDSL";
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
import { JsonValue } from "type-fest";
import { get, toPairs } from "lodash";
import { FormikProps } from "formik";
import { useRouter } from "next/router";
import moment from "moment";
import { GroupSelectField } from "../../../dina-ui/components/group-select/GroupSelectField";
import { UserPreference } from "../../../dina-ui/types/user-api";
import { FormikButton, useAccount } from "..";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";

export interface QueryPageProps<TData extends KitsuResource> {
  columns: ColumnDefinition<TData>[];
  indexName: string;
  initData?: TData[];
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
  initData,
  bulkDeleteButtonProps,
  bulkEditPath,
  omitPaging,
  reactTableProps,
  defaultSort,
  onSortedChange
}: QueryPageProps<TData>) {
  const { apiClient, save, doOperations } = useApiClient();
  const { formatMessage } = useIntl();
  const isFromLoadedRef = useRef<boolean>(true);
  const pageRef = useRef<FormikProps<any>>(null);
  const [initSavedSearchValues, setInitSavedSearchValues] =
    useState<Map<string, JsonValue[]>>();
  const { username, subject } = useAccount();
  const { groupNames } = useAccount();
  const router = useRouter();
  const isResetRef = useRef<boolean>(false);
  // JSONAPI sort attribute.
  const [sortingRules, setSortingRules] = useState(defaultSort);
  const [searchResults, setSearchResults] = useState<{
    results?: TData[];
    isFromSearch?: boolean;
  }>({});
  const showRowCheckboxes = Boolean(bulkDeleteButtonProps || bulkEditPath);

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

  // Retrieve the actual saved search content
  const formValues = initSavedSearchValues?.values().next().value;

  // tslint:disable: no-string-literal
  const savedEsIndexMapping = formValues
    ? toPairs(formValues as JsonValue[])
        ?.filter(([key, _]) => key !== "group")?.[0]
        ?.["queryRows"]?.filter(([_, value]) =>
          get(value, "props.esIndexMapping")
        )?.[0]?.[1]?.["props"]?.["esIndexMapping"]
    : undefined;

  const computedReactTableProps =
    typeof reactTableProps === "function"
      ? reactTableProps(
          searchResults?.isFromSearch
            ? searchResults.results
            : (initData as any),
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
    isResetRef.current = true;
    const resetToVal = {
      queryRows: [
        {
          fieldName: sortedData?.[0]?.value + "(" + sortedData?.[0]?.type + ")",
          matchType: "match",
          boolean: "true",
          date: moment().format()
        }
      ],
      group: groupNames?.[0]
    };
    formik?.setValues(resetToVal);

    const submitVal = {
      queryRows: [
        {
          fieldName: sortedData?.[0]?.value,
          matchType: "match",
          boolean: "true",
          date: moment().format(),
          type: sortedData?.[0]?.type
        }
      ],
      group: groupNames?.[0]
    };
    onSubmit({ submittedValues: submitVal });
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
    return resp?.data?.hits.hits.map(hit => hit._source?.data);
  }

  const onSubmit = ({ submittedValues }) => {
    // After a search, the reset filter or loaded from saved search query should be reset
    isResetRef.current = false;
    isFromLoadedRef.current = false;
    const queryDSL = transformQueryToDSL(submittedValues);
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
    resp.data.body.attributes.map(key => {
      result.push({
        label: key.name,
        value: key.path
          ? key.path + "." + key.name
          : key.name === "id" || "type"
          ? "data." + key.name
          : key.name,
        type: key.type,
        path: key.path
      });
    });

    resp.data.body.relationships.attributes.map(key => {
      result.push({
        label: key.path?.includes(".")
          ? key.path.substring(key.path.indexOf(".") + 1) + "." + key.name
          : key.name,
        value: key.path
          ? key.path + "." + key.name
          : key.name === "id" || "type"
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

  function loadSavedSearch(savedSearchName, savedSearches) {
    isFromLoadedRef.current = true;
    const initValus = new Map().set(
      savedSearchName,
      savedSearches
        ? savedSearches[0]?.savedSearches?.[username as any]?.[savedSearchName]
        : [{}]
    );
    setInitSavedSearchValues(initValus);
  }

  function saveSearch(isDefault, userPreferences, searchName) {
    let newSavedSearches;
    const mySavedSearches = userPreferences;

    if (
      mySavedSearches &&
      mySavedSearches?.[0]?.savedSearches &&
      Object.keys(mySavedSearches?.[0]?.savedSearches)?.length > 0
    ) {
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

    save([saveArgs], { apiBaseUrl: "/user-api" }).then(() => router.reload());
  }

  async function deleteSavedSearch(
    savedSearchName: string,
    savedSearches: UserPreference[]
  ) {
    const mySavedSearch = savedSearches;
    delete mySavedSearch?.[username as any]?.[`${savedSearchName}`];

    await doOperations(
      [
        {
          op: "DELETE",
          path: `user-preference/${savedSearches?.[0].id}`
        }
      ],
      { apiBaseUrl: "/user-api" }
    );
    router.reload();
  }
  const sortedData = data
    ?.sort((a, b) => a.label.localeCompare(b.label))
    .filter(prop => !prop.label.startsWith("group"));
  const initialValues =
    isFromLoadedRef.current && formValues && toPairs(formValues).length > 0
      ? formValues
      : pageRef.current?.values
      ? pageRef.current?.values
      : {
          queryRows: [
            {
              fieldName:
                sortedData?.[0]?.value + "(" + sortedData?.[0]?.type + ")",
              matchType: "match",
              boolean: "true",
              date: moment().format()
            }
          ]
        };

  return (
    <DinaForm
      key={uuidv4()}
      innerRef={pageRef}
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <label
        style={{ fontSize: 20, fontFamily: "sans-serif", fontWeight: "bold" }}
      >
        <DinaMessage id="search" />
      </label>
      <QueryBuilder
        name="queryRows"
        esIndexMapping={sortedData}
        isResetRef={isResetRef}
        isFromLoadedRef={isFromLoadedRef}
      />
      <DinaFormSection horizontal={"flex"}>
        <GroupSelectField name="group" className="col-md-4" />
      </DinaFormSection>
      <div className="d-flex justify-content-end mb-3">
        <SubmitButton>{formatMessage({ id: "search" })}</SubmitButton>
        <FormikButton className="btn btn-secondary mx-2" onClick={resetForm}>
          <DinaMessage id="resetFilters" />
        </FormikButton>
      </div>
      {withResponse(savedSearchQuery, ({ data: userPreferences }) => {
        const initialSavedSearches = userPreferences?.[0]?.savedSearches?.[
          username as any
        ] as any;
        return (
          <SavedSearch
            userPreferences={userPreferences}
            loadSavedSearch={loadSavedSearch}
            deleteSavedSearch={deleteSavedSearch}
            saveSearch={saveSearch}
            savedSearchNames={
              initialSavedSearches ? Object.keys(initialSavedSearches) : []
            }
            initialSavedSearches={initialSavedSearches}
            selectedSearch={
              initSavedSearchValues
                ? initSavedSearchValues.keys().next().value
                : undefined
            }
          />
        );
      })}

      <div
        className="query-table-wrapper"
        role="search"
        aria-label={formatMessage({ id: "queryTable" })}
      >
        <div className="mb-1">
          {!omitPaging && (
            <div className="d-flex align-items-end">
              <span>
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
          data={searchResults?.results ?? initData}
          minRows={1}
          {...resolvedReactTableProps}
          pageText={<CommonMessage id="page" />}
          noDataText={<CommonMessage id="noRowsFound" />}
          ofText={<CommonMessage id="of" />}
          rowsText={formatMessage({ id: "rows" })}
          previousText={<CommonMessage id="previous" />}
          nextText={<CommonMessage id="next" />}
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
