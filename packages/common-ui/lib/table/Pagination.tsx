import { Table } from "@tanstack/react-table";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { useState } from "react";
import { useIntl } from "react-intl";
import CreatableSelect from "react-select/creatable";
import { SelectOption } from "../formik-connected/SelectField";

export function Pagination<TData>({
  table,
  pageSizeOptions
}: {
  table: Table<TData>;
  pageSizeOptions: number[];
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
    <div className="-pagination" data-testid="pagination">
      <div className="-previous">
        <button
          type="button"
          className="-btn"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {formatMessage({ id: "previous" })}
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
              max={table.getPageCount()}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
            />
          </div>{" "}
          {formatMessage({ id: "of" })}{" "}
          <span className="-totalPages">{table.getPageCount()}</span>
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
            options={selectOptions}
            formatCreateLabel={(inputValue) => `Use "${inputValue}"`}
          ></CreatableSelect>
        </span>
      </div>
      <div className="-next">
        <button
          type="button"
          className="-btn"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {formatMessage({ id: "next" })}
        </button>
      </div>
    </div>
  );
}
