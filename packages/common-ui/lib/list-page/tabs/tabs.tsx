import { MaterialSample } from "../../../../dina-ui/types/collection-api/resources/MaterialSample";
import { MemoizedReactTable } from "../QueryPageTable";
import { QueryPageTabProps } from "../QueryPage";

// ListViewTab.tsx
export const ListViewTab: React.FC<QueryPageTabProps<MaterialSample>> = ({
  data,
  loading,
  columns,
  pageSize,
  pageOffset,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  sortingRules
}) => {
  return (
    <MemoizedReactTable
      columns={columns as any}
      data={data}
      loading={loading}
      manualPagination={true}
      pageSize={pageSize}
      pageCount={Math.ceil(totalRecords / pageSize)}
      page={pageOffset / pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      manualSorting={true}
      onSortingChange={onSortingChange}
      sort={sortingRules}
      className="-striped react-table-overflow"
    />
  );
};
