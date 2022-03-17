import { FilterParam, KitsuResource, PersistedResource } from "kitsu";
import { useState, useMemo, useRef, useEffect } from "react";
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
import { cloneDeep, toPairs } from "lodash";
import { FormikProps } from "formik";
import { GroupSelectField } from "../../../dina-ui/components/group-select/GroupSelectField";
import { UserPreference } from "../../../dina-ui/types/user-api";
import { AreYouSureModal, FormikButton, useAccount, useModal } from "..";
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
  const { apiClient, save } = useApiClient();
  const { formatMessage } = useIntl();
  const { openModal } = useModal();
  const isFromLoadedRef = useRef<boolean>(false);
  const pageRef = useRef<FormikProps<any>>(null);
  // Initial saved search values for the user with its saved search names as keys
  const [initSavedSearchValues, setInitSavedSearchValues] =
    useState<Map<string, JsonValue[]>>();
  const { username, subject } = useAccount();
  const { groupNames } = useAccount();
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

  // Retrieve the actual saved search content:{group: cnc,queryRows: {}}
  const formValues = initSavedSearchValues?.values().next().value;
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
    const resetToVal = {
      queryRows: [{}],
      group: groupNames?.[0]
    };
    formik?.setValues(resetToVal);
    onSubmit({ submittedValues: resetToVal });
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
    if (!submittedValues) return;
    const copy = cloneDeep(submittedValues);
    // After a search, isFromLoaded should be reset
    isFromLoadedRef.current = false;
    const queryDSL = transformQueryToDSL(copy);
    // No search when query has no content in it
    if (!queryDSL || !Object.keys(queryDSL).length) return;
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

  useEffect(() => {
    if (!isFromLoadedRef.current) {
      apiClient
        .get<UserPreference[]>("user-api/user-preference", {
          filter: {
            userId: subject as FilterParam
          },
          page: { limit: 1000 }
        })
        .then(response => {
          loadSavedSearch("default", response?.data);
        });
    }
  }, []);

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

  if (loading || error) return <></>;

  function loadSavedSearch(savedSearchName, userPreferences) {
    isFromLoadedRef.current = true;
    const initValus = new Map().set(
      savedSearchName,
      userPreferences
        ? userPreferences[0]?.savedSearches?.[username as any]?.[
            savedSearchName
          ]
        : [{}]
    );
    setInitSavedSearchValues(initValus);
  }

  async function saveSearch(isDefault, userPreferences, searchName) {
    const computedName = isDefault ? "default" : searchName ?? "default";

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
      mySavedSearches[0].savedSearches[username as any][computedName] = {
        ...pageRef.current?.values,
        savedSearchSelect: computedName
      };
    } else {
      newSavedSearches = {
        [`${username}`]: {
          [computedName]: {
            ...pageRef.current?.values,
            savedSearchSelect: computedName
          }
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
    loadSavedSearch(computedName, userPreferences);
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

  const sortedData = data
    ?.sort((a, b) => a.label.localeCompare(b.label))
    .filter(prop => !prop.label.startsWith("group"));

  const initialValues = isFromLoadedRef.current
    ? formValues && toPairs(formValues).length > 0
      ? formValues
      : {
          group: groupNames?.[0],
          queryRows: [{}]
        }
    : pageRef.current?.values
    ? pageRef.current?.values
    : {
        group: groupNames?.[0],
        queryRows: [{}]
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
        isFromLoadedRef={isFromLoadedRef}
      />
      <DinaFormSection horizontal={"flex"}>
        <GroupSelectField
          isMulti={true}
          name="group"
          className="col-md-4"
          onChange={(value, formik) => {
            const resetToVal = cloneDeep(formik.values);
            onSubmit({ submittedValues: { ...resetToVal, group: value } });
          }}
        />
      </DinaFormSection>

      <div className="d-flex mb-3">
        <div className="flex-grow-1">
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
