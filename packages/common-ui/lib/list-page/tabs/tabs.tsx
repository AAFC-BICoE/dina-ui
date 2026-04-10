import { Metadata } from "../../../../dina-ui/types/objectstore-api/resources/Metadata";

import { MemoizedReactTable } from "../QueryPageTable";
import { QueryPageTabProps } from "../QueryPage";
import { StoredObjectGallery } from "../../../../dina-ui/components/object-store";
import React, { Component, useMemo } from "react";
import { KitsuResource } from "kitsu";

export function ListViewTab<TData extends KitsuResource>({
  data,
  loading,
  columns,
  pageSize,
  pageOffset,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  sortingRules,
  rowStyling
}: QueryPageTabProps<TData>) {
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
      rowStyling={rowStyling}
    />
  );
}

export const GalleryViewTab: React.FC<QueryPageTabProps<Metadata>> = ({
  data,
  loading,
  columns,
  pageSize,
  pageOffset,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  sortingRules,
  CheckBoxField,
  previewMetadata,
  setPreviewMetadata
}) => {
  const HIGHLIGHT_COLOR = "rgb(222, 252, 222)";

  const TBodyGallery = useMemo(
    () =>
      class ReusedTBodyComponent extends Component {
        public static innerComponent;
        public render() {
          return ReusedTBodyComponent.innerComponent;
        }
      },
    []
  );

  const resolveGalleryProps = () => {
    TBodyGallery.innerComponent = (
      <StoredObjectGallery
        CheckBoxField={CheckBoxField}
        metadatas={(data as any) ?? []}
        previewMetadataId={previewMetadata?.id as any}
        onSelectPreviewMetadata={setPreviewMetadata}
      />
    );

    return {
      TbodyComponent: TBodyGallery,
      getTrProps: (_, rowInfo) => {
        if (rowInfo) {
          const metadata: Metadata = rowInfo.original;
          return {
            style: {
              background: metadata.id === previewMetadata?.id && HIGHLIGHT_COLOR
            }
          };
        }
        return {};
      },
      enableSorting: true,
      enableMultiSort: true
    };
  };
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
      sort={sortingRules}
      onSortingChange={onSortingChange}
      {...resolveGalleryProps()}
      className="-striped react-table-overflow"
    />
  );
};
