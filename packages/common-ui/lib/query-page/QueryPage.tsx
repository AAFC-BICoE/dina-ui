import { KitsuResource, PersistedResource } from "kitsu";
import { useState, useMemo, useRef } from "react";
import { useIntl } from "react-intl";
import ReactTable, { Column, SortingRule, TableProps } from "react-table";
import { useApiClient } from "../api-client/ApiClientContext";
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

import {
  CheckBoxFieldProps,
  useGroupedCheckBoxes
} from "../formik-connected/GroupedCheckBoxFields";
import { ESIndexMapping } from "../query-builder/QueryRow";
import useSWR from "swr";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import { GroupSelectField } from "../../../dina-ui/components/group-select/GroupSelectField";
import { FormikButton, LimitOffsetPageSpec, useAccount } from "..";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { FormikProps } from "formik";

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

/**
 * Default size for QueryTable.
 */
const DEFAULT_PAGE_SIZE = 25;

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
  const { apiClient } = useApiClient();
  const { groupNames } = useAccount();
  const { formatMessage } = useIntl();
  const formRef = useRef<FormikProps<any>>(null);
  const isResetRef = useRef<boolean>(false);
  // JSONAPI sort attribute.
  const [sortingRules, setSortingRules] = useState(defaultSort);
  const [searchResults, setSearchResults] = useState<{
    results?: TData[];
    totalResults?: number;
    isFromSearch?: boolean;
  }>({});
  const showRowCheckboxes = Boolean(bulkDeleteButtonProps || bulkEditPath);
  const [visible, setVisible] = useState(false);

  // JSONAPI page spec.
  const [pagination, setPagination] = useState<LimitOffsetPageSpec>({
    limit: DEFAULT_PAGE_SIZE,
    offset: 0
  });

  // Current page being displayed.
  const [currentPage, setCurrentPage] = useState(0);

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
      queryRows: [{}],
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
    return resp?.data?.hits;
  }

  const onSubmit = ({ submittedValues }) => {
    const queryDSL = transformQueryToDSL(submittedValues, pagination);
    // No search when query has no content in it
    if (!Object.keys(queryDSL).length) return;
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
        totalResults: result?.total.value,
        isFromSearch: true
      });
    });
  };

  /**
   * Triggered when the user changes the page. This will also determine the offset to apply to the
   * elasticsearch.
   *
   * @param newPageNumber The new page number set.
   */
  const onPageChange = (newPageNumber: number) => {
    setCurrentPage(newPageNumber);

    setPagination({ ...pagination, offset: newPageNumber * pagination.limit });

    // Trigger submit to apply new pagination only if not using initData.
    if (searchResults?.results) {
      formRef.current?.submitForm();
    }
  };

  /**
   * Triggered when the user changes the number of records to display on a page. This will also
   * change the number of records retrieved from elasticsearch.
   *
   * @param newPageSize Number of records to display on page.
   */
  const onPageSizeChange = (newPageSize: number) => {
    setPagination({ ...pagination, limit: newPageSize });

    // Trigger submit to apply new pagination only if not using initData.
    if (searchResults?.results) {
      formRef.current?.submitForm();
    }
  };

  const totalRecords = searchResults?.totalResults ?? initData?.length;

  const numberOfPages = totalRecords
    ? Math.floor(totalRecords / pagination.limit)
    : undefined;

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

  const sortedData = data
    ?.sort((a, b) => a.label.localeCompare(b.label))
    .filter(prop => !prop.label.startsWith("group"));

  return (
    <DinaForm
      innerRef={formRef}
      initialValues={{
        group: groupNames?.[0],
        queryRows: [{}]
      }}
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
      />
      <DinaFormSection horizontal={"flex"}>
        <GroupSelectField
          name="group"
          className="col-md-4"
          onChange={(value, formik) =>
            onSubmit({ submittedValues: { ...formik.values, group: value } })
          }
        />
      </DinaFormSection>
      <div className="d-flex justify-content-end mb-3">
        <SubmitButton>{formatMessage({ id: "search" })}</SubmitButton>
        <FormikButton className="btn btn-secondary mx-2" onClick={resetForm}>
          <DinaMessage id="resetFilters" />
        </FormikButton>
      </div>
      <div
        className="query-table-wrapper"
        role="search"
        aria-label={formatMessage({ id: "queryTable" })}
      >
        <div className="mb-1">
          {!omitPaging && (
            <div className="d-flex ">
              <span>
                <CommonMessage
                  id="tableTotalCount"
                  values={{ totalCount: totalRecords }}
                />
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
          pageSize={pagination.limit}
          pages={numberOfPages}
          page={currentPage}
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
