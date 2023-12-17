import { Table } from "@tanstack/react-table";
import { useIntl } from "react-intl";
import Creatable from "react-select/creatable";
import { SelectOption } from "../formik-connected/SelectField";

export function Pagination<TData>({
  table,
  pageSizeOptions
}: {
  table: Table<TData>;
  pageSizeOptions: number[];
}) {
  const { formatMessage } = useIntl();

  return (
    <div className="-pagination">
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
        <span className="select-wrap -pageSizeOptions">
          <Creatable<SelectOption<number>, boolean>
            name="pageSize"
            value={{
              value: table.getState().pagination.pageSize,
              label: `${table.getState().pagination.pageSize} ${formatMessage({
                id: "rows"
              })}`
            }}
            aria-label="rows per page"
            onChange={(selected) => {
              if (selected) {
                table.setPageSize(
                  Number((selected as SelectOption<number>).value)
                );
              }
            }}
            options={pageSizeOptions.map((pageSize) => ({
              value: pageSize,
              label: `${pageSize}`
            }))}
            formatCreateLabel={(inputValue) => `Use "${inputValue}"`}
          ></Creatable>
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
