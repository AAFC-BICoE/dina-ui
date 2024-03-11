import { writeStorage } from "@rehooks/local-storage";
import { FormikContextType } from "formik";
import { compact, toPairs } from "lodash";
import { useRouter } from "next/router";
import {
  AreYouSureModal,
  BulkSelectableFormValues,
  CommonMessage,
  FormikButton,
  useApiClient,
  useModal
} from "..";
import { uuidQuery } from "../list-page/query-builder/query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { DynamicFieldsMappingConfig, TableColumn } from "../list-page/types";
import { KitsuResource } from "kitsu";
import { useEffect } from "react";

/** Common button props for the bulk edit/delete buttons */
function bulkButtonProps(ctx: FormikContextType<BulkSelectableFormValues>) {
  // Disable the button if none are selected:
  const disabled =
    !ctx.values.itemIdsToSelect ||
    !compact(Object.values(ctx.values.itemIdsToSelect)).length;
  return { disabled };
}

export interface BulkDeleteButtonProps {
  typeName: string;
  apiBaseUrl: string;
}

export function BulkDeleteButton({
  apiBaseUrl,
  typeName
}: BulkDeleteButtonProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const { doOperations } = useApiClient();

  return (
    <FormikButton
      buttonProps={bulkButtonProps}
      className="btn btn-danger bulk-delete-button"
      onClick={(values: BulkSelectableFormValues) => {
        const resourceIds = toPairs(values.itemIdsToSelect)
          .filter((pair) => pair[1])
          .map((pair) => pair[0]);

        openModal(
          <AreYouSureModal
            actionMessage={
              <span>
                <CommonMessage id="deleteSelectedButtonText" /> (
                {resourceIds.length})
              </span>
            }
            onYesButtonClicked={async () => {
              await doOperations(
                resourceIds.map((id) => ({
                  op: "DELETE",
                  path: `${typeName}/${id}`
                })),
                { apiBaseUrl }
              );

              // Refresh the page:
              await router.reload();
            }}
          />
        );
      }}
    >
      <CommonMessage id="deleteSelectedButtonText" />
    </FormikButton>
  );
}

export interface BulkEditButtonProps {
  /** Where to perform the request for the bulk edit. */
  pathname: string;
  singleEditPathName?: string;
}

/**
 * Key value where the bulk edit ids will be stored.
 *
 * This constant is available to use for setting and retrieving the value.
 */
export const BULK_EDIT_IDS_KEY = "bulkEditIds";

export function BulkEditButton({
  pathname,
  singleEditPathName
}: BulkEditButtonProps) {
  const router = useRouter();

  return (
    <FormikButton
      buttonProps={bulkButtonProps}
      className="btn btn-primary ms-2 bulk-edit-button"
      onClick={async (values: BulkSelectableFormValues) => {
        const ids = toPairs(values.itemIdsToSelect)
          .filter((pair) => pair[1])
          .map((pair) => pair[0]);

        writeStorage<string[]>(BULK_EDIT_IDS_KEY, ids);
        if (singleEditPathName && ids.length === 1) {
          await router.push(`${singleEditPathName}?id=${ids[0]}`);
        } else {
          await router.push({ pathname });
        }
      }}
    >
      <CommonMessage id="editSelectedButtonText" />
    </FormikButton>
  );
}

export interface DataExportButtonProps<TData extends KitsuResource> {
  /** Where to perform the request for the data export. */
  pathname: string;
  totalRecords: number;
  query: any;
  uniqueName: string;
  columns: TableColumn<TData>[];
  dynamicFieldMapping: DynamicFieldsMappingConfig | undefined;
  indexName: string;
  entityLink: string;
}

/**
 * Key value where the data export search results will be stored.
 *
 * This constant is available to use for setting and retrieving the value.
 */
export const DATA_EXPORT_QUERY_KEY = "dataExportQuery";
export const DATA_EXPORT_TOTAL_RECORDS_KEY = "dataExportTotalRecords";
export const DATA_EXPORT_COLUMNS_KEY = "dataExportColumns";
export const DATA_EXPORT_DYNAMIC_FIELD_MAPPING_KEY = "dynamicFieldMapping";
export const OBJECT_EXPORT_IDS_KEY = "objectExportIds";

export function DataExportButton<TData extends KitsuResource>({
  pathname,
  totalRecords,
  query,
  uniqueName,
  columns,
  dynamicFieldMapping,
  indexName,
  entityLink
}: DataExportButtonProps<TData>) {
  const router = useRouter();
  useEffect(() => {
    writeStorage<string[]>(OBJECT_EXPORT_IDS_KEY, []);
  });
  return (
    <FormikButton
      buttonProps={(_ctx) => ({ disabled: totalRecords === 0 })}
      className="btn btn-primary ms-2"
      onClick={async (values: BulkSelectableFormValues) => {
        const selectedResourceIds: string[] = values.itemIdsToSelect
          ? Object.keys(values.itemIdsToSelect)
          : [];
        const selectedIdsQuery = uuidQuery(selectedResourceIds);
        writeStorage<string[]>(OBJECT_EXPORT_IDS_KEY, selectedResourceIds);
        writeStorage<any>(
          DATA_EXPORT_QUERY_KEY,
          selectedResourceIds.length > 0 ? selectedIdsQuery : query
        );
        writeStorage<number>(
          DATA_EXPORT_TOTAL_RECORDS_KEY,
          selectedResourceIds.length > 0
            ? selectedResourceIds.length
            : totalRecords
        );
        writeStorage<TableColumn<TData>[]>(
          `${uniqueName}_${DATA_EXPORT_COLUMNS_KEY}`,
          columns
        );
        writeStorage<DynamicFieldsMappingConfig | undefined>(
          `${uniqueName}_${DATA_EXPORT_DYNAMIC_FIELD_MAPPING_KEY}`,
          dynamicFieldMapping
        );
        await router.push({
          pathname,
          query: {
            uniqueName,
            indexName,
            entityLink
          }
        });
      }}
    >
      <CommonMessage id="exportButtonText" />
    </FormikButton>
  );
}

export interface BulkSplitButtonProps {
  /**
   * Page where the bulk split is being performed.
   */
  pathname: string;
}

/**
 * String key for the local storage of the bulk split ids.
 */
export const BULK_SPLIT_IDS = "";

export function BulkSplitButton({ pathname }: BulkSplitButtonProps) {
  const router = useRouter();

  return (
    <FormikButton
      buttonProps={bulkButtonProps}
      className="btn btn-primary bulk-split-button"
      onClick={async (values: BulkSelectableFormValues) => {
        const ids = toPairs(values.itemIdsToSelect)
          .filter((pair) => pair[1])
          .map((pair) => pair[0]);

        writeStorage<string[]>(BULK_SPLIT_IDS, ids);
        await router.push({ pathname });
      }}
    >
      <CommonMessage id="splitSelectedButtonText" />
    </FormikButton>
  );
}
