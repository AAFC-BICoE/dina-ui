import { flexRender, Header, SortingState } from "@tanstack/react-table";
import { FaArrowDown, FaArrowUp } from "react-icons/fa6";
import { FilterInput } from "./FilterInput";
import classnames from "classnames";

interface SmartHeaderProps<TData> {
  header: Header<TData, unknown>;
  sorting: SortingState;
}

export function SmartHeader<TData>({
  header,
  sorting
}: SmartHeaderProps<TData>) {
  const defaultSortRule = sorting?.find(
    (sortRule) => sortRule.id === header.id
  );

  const isSortedDesc =
    header.column.getIsSorted() === "asc" || defaultSortRule?.desc === false;

  const isSortedAsc =
    header.column.getIsSorted() === "desc" || defaultSortRule?.desc === true;

  return (
    <th
      colSpan={header.colSpan}
      className={classnames(header.column.getCanSort() && "-cursor-pointer")}
      style={{
        width:
          header.column.columnDef.size === 0
            ? "auto"
            : header.column.columnDef.size
      }}
      onClick={header.column.getToggleSortingHandler()}
    >
      {header.isPlaceholder ? null : (
        <div
          className={
            header.column.getCanSort()
              ? "-cursor-pointer select-none column-header"
              : "column-header"
          }
        >
          <span className="d-flex align-items-center justify-content-center">
            {flexRender(header.column.columnDef.header, header.getContext())}

            {isSortedAsc && (
              <FaArrowDown
                className="-sort-asc"
                onClick={header.column.getToggleSortingHandler()}
              />
            )}

            {isSortedDesc && (
              <FaArrowUp
                className="-sort-desc"
                onClick={header.column.getToggleSortingHandler()}
              />
            )}
          </span>
        </div>
      )}
      {header.column.getCanFilter() ? (
        <div>
          <FilterInput column={header.column} />
        </div>
      ) : null}
    </th>
  );
}
