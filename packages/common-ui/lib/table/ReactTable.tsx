import {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  PaginationState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import classnames from "classnames";
import {
  Dispatch,
  Fragment,
  MouseEvent,
  SetStateAction,
  useEffect,
  useState
} from "react";
import { useIntl } from "react-intl";
import { LoadingSpinner } from "../loading-spinner/LoadingSpinner";
import { FilterInput } from "./FilterInput";
import { Pagination } from "./Pagination";
import { DefaultRow, DraggableRow } from "./RowComponents";
import { FaArrowDown, FaArrowUp, FaExpand, FaCompress } from "react-icons/fa";

export const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500, 1000];

export interface ReactTableProps<TData> {
  // Columns definations, ref: https://tanstack.com/table/v8/docs/api/core/column
  columns: ColumnDef<TData>[];
  data: TData[];
  onDataChanged?: (newData: TData[]) => void;
  enableEditing?: boolean;
  // When DnD is enabled, need to call onRowMove() after DnD
  onRowMove?: (from: number, to: number) => void;
  // Enable row drag and drop
  enableDnd?: boolean;
  // Sorting
  enableSorting?: boolean;
  enableMultiSort?: boolean;
  manualSorting?: boolean;
  sort?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  // Filtering
  enableFilters?: boolean;
  manualFiltering?: boolean;
  onColumnFiltersChange?: (columnFilters: ColumnFiltersState) => void;
  defaultColumnFilters?: ColumnFiltersState;
  // Class name of this component.
  className?: string;
  // handle pagination manually
  manualPagination?: boolean;
  pageSize?: number;
  pageCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  // Show pagination on the bottom
  showPagination?: boolean;
  // Show pagination on the top
  showPaginationTop?: boolean;
  // Display pagination with the icons only. Perfect for small tables.
  smallPaginationButtons?: boolean;
  pageSizeOptions?: number[];
  defaultExpanded?: ExpandedState;
  // A function to render the SubComponent in the expanded area.
  renderSubComponent?: (props: {
    row: Row<TData>;
    index?: number;
  }) => React.ReactElement;
  // A function that returns true, the the row is expandable
  getRowCanExpand?: (row: Row<TData>) => boolean;
  // Styling to be applied to each row of the React Table
  rowStyling?: (row?: Row<TData>) => any;
  loading?: boolean;
  columnVisibility?: VisibilityState;
  highlightRow?: boolean;
  TbodyComponent?: React.ElementType;

  // Hides the table rendering. Useful for accessing table states but don't want to render table
  hideTable?: boolean;

  setResourceRowModel?: Dispatch<SetStateAction<Row<TData>[] | undefined>>;

  // Show a button to toggle fullscreen mode for the table.
  enableFullscreen?: boolean;

  // Fullscreen mode state, this should be controlled by the parent component.
  isFullscreen?: boolean;
  setIsFullscreen?: Dispatch<SetStateAction<boolean>>;
}

const DEFAULT_SORT: SortingState = [
  {
    id: "createdOn",
    desc: true
  }
];

export function ReactTable<TData>({
  data,
  onRowMove,
  columns,
  enableDnd = false,
  enableSorting = true,
  enableMultiSort = false,
  className,
  showPagination = false,
  showPaginationTop = false,
  manualPagination = false,
  smallPaginationButtons = false,
  pageSize: initPageSize,
  pageCount,
  page,
  onPageChange,
  onPageSizeChange,
  onDataChanged,
  enableEditing,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  sort,
  onSortingChange,
  manualSorting = false,
  defaultExpanded,
  renderSubComponent,
  getRowCanExpand,
  rowStyling,
  loading = false,
  columnVisibility: columnVisibilityExternal,
  highlightRow = true,
  TbodyComponent,
  enableFilters = false,
  manualFiltering = false,
  onColumnFiltersChange,
  defaultColumnFilters = [],
  hideTable = false,
  setResourceRowModel,
  enableFullscreen = false,
  isFullscreen = false,
  setIsFullscreen
}: ReactTableProps<TData>) {
  const { formatMessage } = useIntl();
  const [sorting, setSorting] = useState<SortingState>(sort ?? DEFAULT_SORT);
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(defaultColumnFilters);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: page ?? 0,
    pageSize: initPageSize ?? pageSizeOptions[0]
  });
  useEffect(() => {
    setPagination({
      pageIndex: page ?? 0,
      pageSize: initPageSize ?? pageSizeOptions[0]
    });
  }, [page, initPageSize, pageSizeOptions]);

  function onPaginationChangeInternal(updater) {
    const { pageIndex: oldPageIndex, pageSize: oldPageSize } =
      table.getState().pagination;
    const newState = updater(table.getState().pagination);
    if (oldPageSize !== newState.pageSize) {
      onPageSizeChange?.(newState.pageSize);
    } else if (oldPageIndex !== newState.pageIndex) {
      onPageChange?.(newState.pageIndex);
    }
    setPagination(newState);
  }

  function onSortingChangeInternal(updator) {
    const newState = updator(table.getState().sorting);
    onSortingChange?.(newState);
    setSorting(newState);
  }

  function onColumnFiltersChangeInternal(updator) {
    const newState = updator(table.getState().columnFilters);
    onColumnFiltersChange?.(newState);
    setColumnFilters(newState);
  }

  function handleFullScreenToggle(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation(); // Prevents the click from bubbling up.
    e.preventDefault(); // Prevents any default browser action.
    setIsFullscreen?.((p) => !p);
  }

  const onSortingChangeOption = manualSorting
    ? { onSortingChange: onSortingChangeInternal }
    : { onSortingChange: setSorting };

  const onColumnFilterChangeOption = manualFiltering
    ? { onColumnFiltersChange: onColumnFiltersChangeInternal }
    : { onColumnFiltersChange: setColumnFilters };
  const [columnVisibility, setColumnVisibility] = useState(
    columnVisibilityExternal
  );

  const tableOption = {
    data,
    columns,
    defaultColumn: { minSize: 0, size: 0 },
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && { getSortedRowModel: getSortedRowModel() }),
    ...(enableFilters && { getFilteredRowModel: getFilteredRowModel() }),
    initialState: {
      sorting,
      pagination: { pageIndex, pageSize },
      ...(defaultExpanded && {
        expanded: defaultExpanded
      })
    },
    enableSorting,
    enableMultiSort,
    manualPagination,
    manualSorting,
    ...(!!renderSubComponent &&
      !!getRowCanExpand && {
        getRowCanExpand,
        getExpandedRowModel: getExpandedRowModel()
      }),
    state: {
      sorting,
      ...(columnVisibility && { columnVisibility }),
      ...(enableFilters && columnFilters && { columnFilters }),
      ...(manualPagination && {
        pagination: { pageIndex, pageSize }
      })
    },
    enableFilters,
    manualFiltering,
    onColumnVisibilityChange: setColumnVisibility,
    ...(manualPagination
      ? {
          onPaginationChange: onPaginationChangeInternal,
          pageCount
        }
      : {
          getPaginationRowModel: getPaginationRowModel()
        }),
    ...onSortingChangeOption,
    ...onColumnFilterChangeOption,
    meta: {
      updateData: (rowIndex, columnId, value) => {
        if (enableEditing) {
          onDataChanged?.(
            data.map((row, index) => {
              if (index === rowIndex) {
                return {
                  ...data[rowIndex]!,
                  [columnId]: value
                };
              }
              return row;
            })
          );
        }
      }
    }
  };

  const table = useReactTable<TData>(tableOption);

  useEffect(() => {
    setResourceRowModel?.(table.getRowModel().rows);
  }, [table.getRowModel().rows, setResourceRowModel]);

  return !hideTable ? (
    <div
      data-testid="ReactTable"
      className={classnames(
        "ReactTable",
        className,
        highlightRow && !TbodyComponent ? "-highlight" : "",
        isFullscreen && "fullscreen-mode"
      )}
    >
      {(showPaginationTop || enableFullscreen) && (
        <div className="table-top-controls">
          <div className="pagination-top">
            {showPagination && showPaginationTop && (
              <Pagination
                table={table}
                pageSizeOptions={pageSizeOptions}
                isTop={true}
                displayFirstAndLastOptions={
                  enableSorting && !!sorting && sorting?.length > 0
                }
                smallPaginationButtons={smallPaginationButtons}
              />
            )}
          </div>
          {enableFullscreen && (
            <button
              onClick={handleFullScreenToggle}
              className="fullscreen-toggle-btn me-2"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          )}
        </div>
      )}

      <div className="table-responsive-wrapper">
        <table className="w-100">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const defaultSortRule = sorting?.find(
                    (sortRule) => sortRule.id === header.id
                  );

                  const isSortedDesc =
                    header.column.getIsSorted() === "asc" ||
                    defaultSortRule?.desc === false;

                  const isSortedAsc =
                    header.column.getIsSorted() === "desc" ||
                    defaultSortRule?.desc === true;

                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={classnames(
                        header.column.getCanSort() && "-cursor-pointer"
                      )}
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
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
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
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={table.getAllColumns().length}
                  className="text-center"
                >
                  <LoadingSpinner loading={true} />
                </td>
              </tr>
            ) : !!TbodyComponent ? (
              <tr>
                <td colSpan={table.getAllColumns().length}>
                  <TbodyComponent />
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getAllColumns().length}
                  className="text-center"
                >
                  {formatMessage({ id: "noRowsFound" })}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, index) => (
                <Fragment key={row.id ?? index}>
                  {enableDnd ? (
                    <DraggableRow
                      row={row}
                      reorderRow={onRowMove}
                      className={classnames(
                        `index-${index}`,
                        index % 2 === 0 ? "-odd" : "-even"
                      )}
                      style={rowStyling ? rowStyling(row) : undefined}
                    />
                  ) : (
                    <DefaultRow
                      row={row}
                      className={classnames(
                        `index-${index}`,
                        index % 2 === 0 ? "-odd" : "-even"
                      )}
                      style={rowStyling ? rowStyling(row) : undefined}
                    />
                  )}
                  {row.getIsExpanded() && (
                    <tr>
                      {/* 2nd row is a custom 1 cell row that contains the extended area */}
                      <td colSpan={row.getVisibleCells().length}>
                        {renderSubComponent?.({ row, index })}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <div className="pagination-bottom">
          <Pagination
            table={table}
            pageSizeOptions={pageSizeOptions}
            isTop={false}
            displayFirstAndLastOptions={
              enableSorting && !!sorting && sorting?.length > 0
            }
            smallPaginationButtons={smallPaginationButtons}
          />
        </div>
      )}
    </div>
  ) : null;
}
