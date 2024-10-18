import { Table } from "@tanstack/react-table";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { useState } from "react";
import { useIntl } from "react-intl";
import CreatableSelect from "react-select/creatable";
import { SelectOption } from "../formik-connected/SelectField";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaAngleLeft,
  FaAngleRight
} from "react-icons/fa";
import classNames from "classnames";

export function Pagination<TData>({
  table,
  pageSizeOptions,
  isTop,
  displayFirstAndLastOptions,
  smallPaginationButtons
}: {
  table: Table<TData>;
  pageSizeOptions: number[];
  isTop: boolean;
  displayFirstAndLastOptions: boolean;
  smallPaginationButtons: boolean;
}) {
  const { formatMessage } = useIntl();
  const [selectOptions, setSelectOptions] = useState<
    { value: number; label: string }[]
  >(
    pageSizeOptions.map((pageSize) => ({
      value: pageSize,
      label: `${pageSize}`
    }))
  );

  return (
    <div
      className={classNames(
        "-pagination",
        isTop ? " -pagination-top" : " -pagination-bottom",
        smallPaginationButtons && "-pagination-small"
      )}
      data-testid="pagination"
    >
      {displayFirstAndLastOptions && (
        <div className="-first">
          <button
            type="button"
            className="-btn"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <FaAngleDoubleLeft
              className={
                smallPaginationButtons
                  ? "-pagination-icon"
                  : "me-2 -pagination-icon"
              }
            />
            {!smallPaginationButtons && formatMessage({ id: "first" })}
          </button>
        </div>
      )}
      <div className="-previous">
        <button
          type="button"
          className="-btn"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <FaAngleLeft
            className={
              smallPaginationButtons
                ? "-pagination-icon"
                : "me-2 -pagination-icon"
            }
          />
          {!smallPaginationButtons && formatMessage({ id: "previous" })}
        </button>
      </div>
      <div className="-center">
        <span className="-pageInfo">
          {formatMessage({ id: "page" })}{" "}
          <div className="-pageJump">
            <input
              aria-label="jump to page"
              type="number"
              value={table.getState().pagination.pageIndex + 1}
              min={1}
              max={table.getPageCount() !== 0 ? table.getPageCount() : 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
            />
          </div>{" "}
          {formatMessage({ id: "of" })}{" "}
          <span className="-totalPages">
            {table.getPageCount() !== 0 ? table.getPageCount() : 1}
          </span>
        </span>
        <span className="-select-wrap -pageSizeOptions">
          <span style={{ textTransform: "capitalize" }}>
            <DinaMessage id="rowsPerPage" />
          </span>
          <CreatableSelect<SelectOption<number>>
            name="pageSize"
            value={{
              value: table.getState().pagination.pageSize,
              label: `${table.getState().pagination.pageSize}`
            }}
            aria-label="rows per page"
            onChange={(selected) => {
              if (selected) {
                table.setPageSize(
                  Number((selected as SelectOption<number>).value)
                );
              }
            }}
            onCreateOption={(inputValue: string) => {
              const numValue = parseInt(inputValue, 10);
              if (!isNaN(numValue) && numValue <= 9999 && numValue > 0) {
                const newOption = { value: numValue, label: `${numValue}` };
                setSelectOptions([...selectOptions, newOption]);
                table.setPageSize(numValue);
              }
            }}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: "30px",
                height: "30px"
              }),
              indicatorSeparator: (base) => ({
                ...base,
                marginTop: "0px"
              }),
              dropdownIndicator: (base) => ({
                ...base,
                paddingTop: "0px"
              }),
              singleValue: (base) => ({
                ...base,
                marginTop: "-8px"
              })
            }}
            classNamePrefix="react-select"
            options={selectOptions}
            formatCreateLabel={(inputValue) => `Use "${inputValue}"`}
          />
        </span>
      </div>
      <div className="-next">
        <button
          type="button"
          className="-btn"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {!smallPaginationButtons && formatMessage({ id: "next" })}
          <FaAngleRight
            className={
              smallPaginationButtons
                ? "-pagination-icon"
                : "ms-2 -pagination-icon"
            }
          />
        </button>
      </div>
      {displayFirstAndLastOptions && (
        <div className="-last">
          <button
            type="button"
            className="-btn"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          >
            {!smallPaginationButtons && formatMessage({ id: "last" })}
            <FaAngleDoubleRight
              className={
                smallPaginationButtons
                  ? "-pagination-icon"
                  : "ms-2 -pagination-icon"
              }
            />
          </button>
        </div>
      )}
    </div>
  );
}
