import {
  TextField,
  DATA_EXPORT_SEARCH_RESULTS_KEY,
  useApiClient,
  LoadingSpinner,
  LabelView,
  FieldHeader
} from "..";
import { CustomMenuProps } from "../../../dina-ui/components/collection/material-sample/GenerateLabelDropdownButton";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useState, useEffect } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { useIntl } from "react-intl";
import { startCase } from "lodash";
import { Button } from "react-bootstrap";
import useLocalStorage from "@rehooks/local-storage";
import { DataExport } from "packages/dina-ui/types/dina-export-api";
import Kitsu from "kitsu";
import { Table, VisibilityState, Column } from "@tanstack/react-table";
import { table } from "console";
import { Checkbox } from "./GroupedCheckboxWithLabel";

const MAX_DATA_EXPORT_FETCH_RETRIES = 60;

export function ColumnSelector(
  CustomMenu: React.ForwardRefExoticComponent<
    CustomMenuProps & React.RefAttributes<HTMLDivElement>
  >
) {
  return (
    <Dropdown>
      <Dropdown.Toggle>
        <DinaMessage id="selectColumn" />
      </Dropdown.Toggle>
      <Dropdown.Menu as={CustomMenu} />
    </Dropdown>
  );
}

export interface UseColumnChooserProps<TData> {
  /** A unique identifier to be used for local storage key */
  localStorageKey?: string;
  hideExportButton?: boolean;
  reactTable: Table<TData> | undefined;
}

export function useColumnChooser<TData>({
  localStorageKey,
  hideExportButton = false,
  reactTable
}: UseColumnChooserProps<TData>) {
  const { CustomMenu, dataExportError } = useCustomMenu({
    localStorageKey,
    hideExportButton,
    reactTable
  });
  const columnSelector = ColumnSelector(CustomMenu);
  return { columnSelector, CustomMenu, dataExportError };
}

interface UseCustomMenuProps<TData> extends UseColumnChooserProps<TData> {}

function useCustomMenu<TData>({
  localStorageKey,
  hideExportButton,
  reactTable
}: UseCustomMenuProps<TData>) {
  const { formatMessage, messages } = useIntl();
  // For finding columns using text search
  const columnSearchMapping: { label: string; id: string }[] | undefined =
    reactTable?.getAllLeafColumns().map((column) => {
      const messageKey = `field_${column.id}`;
      const label = messages[messageKey]
        ? formatMessage({ id: messageKey as any })
        : startCase(column.id);
      return { label: label.toLowerCase(), id: column.id };
    });
  const [columns, setColumns] = useLocalStorage<
    Column<TData, unknown>[] | undefined
  >(`${localStorageKey}_columnSelector`, reactTable?.getAllLeafColumns());
  // Columns filtered from text search
  const [searchedColumns, setSearchedColumns] = useState(
    reactTable?.getAllLeafColumns()
  );

  useEffect(() => {
    // const initialColumns = reactTable
    //   ?.getAllLeafColumns()
    //   .filter((column) => column.id !== "selectColumn");
    // setColumns(initialColumns);
    // setSearchedColumns(initialColumns);
  }, [reactTable]);

  const [loading, setLoading] = useState(false);
  const [dataExportError, setDataExportError] = useState<JSX.Element>();

  // Keep track of column text search value
  const [filterColumsValue, setFilterColumnsValue] = useState<string>("");

  const { apiClient, save } = useApiClient();

  const [queryObject] = useLocalStorage<object>(DATA_EXPORT_SEARCH_RESULTS_KEY);

  if (queryObject) {
    delete (queryObject as any)._source;
  }

  const queryString = JSON.stringify(queryObject)?.replace(/"/g, '"');
  const columnSelectionCheckboxesInternal = (
    <div>
      <Checkbox
        id="selectAll"
        handleClick={reactTable?.getToggleAllColumnsVisibilityHandler()}
        isChecked={reactTable?.getIsAllColumnsVisible()}
      />
      {searchedColumns?.map((column) => {
        return (
          <>
            <Checkbox
              key={column.id}
              id={column.id}
              handleClick={column.getToggleVisibilityHandler()}
              isChecked={column.getIsVisible()}
              isField={true}
            />
          </>
        );
      })}
    </div>
  );

  async function exportData() {
    setLoading(true);
    // Make query to data-export
    const dataExportSaveArg = {
      resource: {
        type: "data-export",
        source: "dina_material_sample_index",
        query: queryString,
        columns: reactTable
          ? Object.keys(reactTable.getState().columnVisibility).filter(
              (id) => id !== "selectColumn"
            )
          : []
      },
      type: "data-export"
    };
    const dataExportPostResponse = await save<DataExport>([dataExportSaveArg], {
      apiBaseUrl: "/dina-export-api"
    });

    // data-export POST will return immediately but export won't necessarily be available
    // continue to get status of export until it's COMPLETED
    let isFetchingDataExport = true;
    const fetchDataExportRetries = 0;
    let dataExportGetResponse;
    while (
      isFetchingDataExport &&
      fetchDataExportRetries <= MAX_DATA_EXPORT_FETCH_RETRIES
    ) {
      if (dataExportGetResponse?.data?.status === "COMPLETED") {
        // Get the exported data
        await downloadDataExport(apiClient, dataExportPostResponse[0].id);
        isFetchingDataExport = false;
      } else if (dataExportGetResponse?.data?.status === "ERROR") {
        isFetchingDataExport = false;
        setDataExportError(
          <div className="alert alert-danger">
            <DinaMessage id="dataExportError" />
          </div>
        );
      } else {
        dataExportGetResponse = await apiClient.get<DataExport>(
          `dina-export-api/data-export/${dataExportPostResponse[0].id}`,
          {}
        );
        // Wait 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    isFetchingDataExport = false;
    setLoading(false);
  }

  const CustomMenu = React.forwardRef(
    (props: CustomMenuProps, ref: React.Ref<HTMLDivElement>) => {
      if (props.style) {
        props.style.transform = "translate(0px, 40px)";
      }

      return (
        <div
          ref={ref}
          style={{
            ...props.style,
            width: "400px",
            padding: "20px",
            zIndex: 1
          }}
          className={props.className}
          aria-labelledby={props.labelledBy}
        >
          <strong>{<FieldHeader name="filterColumns" />}</strong>
          <input
            autoFocus={true}
            name="filterColumns"
            className="form-control"
            type="text"
            placeholder="Search"
            value={filterColumsValue}
            onChange={(event) => {
              const value = event.target.value;
              setFilterColumnsValue(value);
              if (value === "" || !value) {
                setSearchedColumns(reactTable?.getAllLeafColumns());
              } else {
                const searchedColumnsIds = columnSearchMapping
                  ?.filter((columnMapping) =>
                    columnMapping.label.includes(value?.toLowerCase())
                  )
                  .map((filteredMapping) => filteredMapping.id);
                const filteredColumns = reactTable
                  ?.getAllLeafColumns()
                  .filter((column) => searchedColumnsIds?.includes(column.id));
                setSearchedColumns(filteredColumns);
              }
            }}
          />
          <Dropdown.Divider />
          {columnSelectionCheckboxesInternal}
          {!hideExportButton && (
            <Button
              disabled={loading}
              className="btn btn-primary mt-2 bulk-edit-button"
              onClick={exportData}
            >
              {loading ? (
                <LoadingSpinner loading={loading} />
              ) : (
                formatMessage({ id: "exportButtonText" })
              )}
            </Button>
          )}
        </div>
      );
    }
  );
  return { CustomMenu, dataExportError };
}
export async function downloadDataExport(
  apiClient: Kitsu,
  id: string | undefined
) {
  if (id) {
    const getFileResponse = await apiClient.get(
      `dina-export-api/file/${id}?type=DATA_EXPORT`,
      {
        responseType: "blob"
      }
    );

    // Download the data
    const url = window?.URL.createObjectURL(getFileResponse as any);
    const link = document?.createElement("a");
    link.href = url ?? "";
    link?.setAttribute("download", `${id}`);
    document?.body?.appendChild(link);
    link?.click();
    window?.URL?.revokeObjectURL(url ?? "");
  }
}
