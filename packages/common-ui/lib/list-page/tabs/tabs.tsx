import { Metadata } from "../../../../dina-ui/types/objectstore-api/resources/Metadata";

import { MemoizedReactTable } from "../QueryPageTable";
import { QueryPageTabProps } from "../QueryPage";
import { StoredObjectGallery } from "../../../../dina-ui/components/object-store";
import React, { Component, useEffect, useMemo, useState } from "react";
import { KitsuResource } from "kitsu";
import { ColumnSelectorMemo } from "../../..";
import { MultiSortTooltip } from "../MultiSortTooltip";
import {
  AttachSelectedButton,
  BulkDeleteButton,
  BulkEditButton,
  BulkSplitButton,
  DataExportButton
} from "../../list-page-layout/bulk-buttons";
import { CommonMessage } from "../../intl/common-ui-intl";
import { useIntl } from "react-intl";

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
  enableColumnSelector,
  uniqueName,
  indexMap,
  dynamicFieldMapping,
  displayedColumns,
  onDisplayedColumnsChange,
  excludedRelationshipTypes,
  mandatoryDisplayedColumns,
  nonExportableColumns,
  bulkEditPath,
  bulkDeleteButtonProps,
  dataExportProps,
  bulkSplitPath,
  attachSelectedButtonsProps,
  error,
  enableMultiSort,
  singleEditPath,
  query,
  indexName
}: QueryPageTabProps<TData>) {
  const { formatNumber } = useIntl();

  const [columnSelectorLoading, setColumnSelectorLoading] =
    useState<boolean>(true);

  // If column selector is disabled, the loading spinner should be turned off.
  useEffect(() => {
    if (!enableColumnSelector) {
      setColumnSelectorLoading(false);
    }
  }, [enableColumnSelector]);
  return (
    <div>
      {enableColumnSelector && (
        <ColumnSelectorMemo
          uniqueName={uniqueName}
          exportMode={false}
          indexMapping={indexMap}
          dynamicFieldsMappingConfig={dynamicFieldMapping}
          displayedColumns={displayedColumns as any}
          setDisplayedColumns={onDisplayedColumnsChange as any}
          defaultColumns={columns as any}
          setColumnSelectorLoading={setColumnSelectorLoading}
          excludedRelationshipTypes={excludedRelationshipTypes}
          mandatoryDisplayedColumns={mandatoryDisplayedColumns}
          nonExportableColumns={nonExportableColumns}
        />
      )}
      {bulkEditPath && (
        <BulkEditButton
          pathname={bulkEditPath}
          singleEditPathName={singleEditPath}
        />
      )}
      {bulkDeleteButtonProps && <BulkDeleteButton {...bulkDeleteButtonProps} />}
      {dataExportProps && (
        <DataExportButton
          pathname={dataExportProps.dataExportPath}
          entityLink={dataExportProps.entityLink}
          totalRecords={totalRecords}
          query={query}
          uniqueName={uniqueName}
          columns={columns}
          dynamicFieldMapping={dynamicFieldMapping}
          indexName={indexName}
        />
      )}
      {bulkSplitPath && <BulkSplitButton pathname={bulkSplitPath} />}
      {attachSelectedButtonsProps && (
        <AttachSelectedButton {...attachSelectedButtonsProps} />
      )}
      <div className="d-flex align-items-end justify-content-between">
        <div className="d-flex align-items-end">
          <span id="queryPageCount">
            {/* Loading indicator when total is not calculated yet. */}
            {loading || columnSelectorLoading ? (
              <></>
            ) : (
              <CommonMessage
                id="tableTotalCount"
                values={{ totalCount: formatNumber(totalRecords) }}
              />
            )}
          </span>

          {/* Multi sort tooltip - Only shown if it's possible to sort */}
          {enableMultiSort && <MultiSortTooltip />}
        </div>
      </div>

      {error && (
        <div
          className="alert alert-danger"
          style={{
            whiteSpace: "pre-line"
          }}
        >
          <p>
            {error.errors?.map((e) => e.detail).join("\n") ?? String(error)}
          </p>
        </div>
      )}
      <MemoizedReactTable
        columns={columns as any}
        data={data}
        loading={loading || columnSelectorLoading}
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
    </div>
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
