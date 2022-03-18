import { FilterParam, KitsuResource, PersistedResource } from "kitsu";
import { TableProps, SortingRule } from "react-table";
import { SaveArgs, useApiClient } from "../api-client/ApiClientContext";
import { DinaForm, DinaFormSection } from "../formik-connected/DinaForm";
import { QueryBuilder } from "../query-builder/QueryBuilder";
import { ColumnDefinition } from "../table/QueryTable";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { BulkDeleteButtonProps } from "../../lib/list-page-layout/bulk-buttons";
import {
  JsonApiQuerySpec,
  useQuery,
  withResponse
} from "../api-client/useQuery";
import { CheckBoxFieldProps } from "../formik-connected/GroupedCheckBoxFields";
import { ESIndexMapping, QueryRowExportProps } from "../query-builder/QueryRow";
import useSWR from "swr";
import { v4 as uuidv4 } from "uuid";
import { SavedSearch } from "./SavedSearch";
import { JsonValue } from "type-fest";
import { cloneDeep, toPairs } from "lodash";
import { GroupSelectField } from "../../../dina-ui/components/group-select/GroupSelectField";
import { UserPreference } from "../../../dina-ui/types/user-api";
import { AreYouSureModal, FormikButton, useAccount, useModal } from "..";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { FormikProps } from "formik";
import { QueryResults } from "./QueryResults";
import { useEffect, useMemo, useRef, useState } from "react";
import { TransformQueryToDSLParams } from "../util/transformToDSL";

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
  const { openModal } = useModal();
  const pageRef = useRef<FormikProps<any>>(null);
  // Initial saved search values for the user with its saved search names as keys
  const [initSavedSearchValues, setInitSavedSearchValues] =
    useState<Map<string, JsonValue[]>>();
  const { username, subject } = useAccount();
  const { groupNames } = useAccount();

  // Setup default search query
  const [searchGroup, setSearchGroup] = useState<string>(groupNames?.[0] ?? "");
  const [searchQueries, setSearchQueries] = useState<QueryRowExportProps[]>([
    {
      fieldName: ""
    }
  ]);

  function resetForm(_, formik) {
    const resetToVal = {
      queryRows: [{}],
      group: groupNames?.[0]
    };
    formik?.setValues(resetToVal);
    onSubmit({ submittedValues: resetToVal });
  }

  const onSubmit = ({ submittedValues }) => {
    setSearchGroup(submittedValues?.group);
    setSearchQueries(submittedValues?.queryRows);
  };

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
      shouldRetryOnError: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  function loadSavedSearch(savedSearchName, userPreferences) {
    // const initValus = new Map().set(
    //   savedSearchName,
    //   userPreferences
    //     ? userPreferences[0]?.savedSearches?.[username as any]?.[
    //         savedSearchName
    //       ]
    //     : [{}]
    // );
    // setSearchQueries({
    //   ...searchQueries,
    //   queryRows: userPreferences
    //     ? userPreferences[0]?.savedSearches?.[username as any]?.[
    //         savedSearchName
    //       ]
    //     : [{}],
    // });
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
      initialValues={{
        group: searchGroup,
        queryRows: searchQueries
      }}
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
      <QueryResults
        searchGroup={searchGroup}
        searchQueries={searchQueries}
        fallbackQuery={fallbackQuery}
        columns={columns}
        omitPaging={omitPaging}
        onSortedChange={onSortedChange}
        indexName={indexName}
        reactTableProps={reactTableProps}
        defaultSort={defaultSort}
        bulkDeleteButtonProps={bulkDeleteButtonProps}
        bulkEditPath={bulkEditPath}
      />
    </DinaForm>
  );
}
