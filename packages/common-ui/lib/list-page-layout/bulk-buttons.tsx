import { writeStorage } from "@rehooks/local-storage";
import { FormikContextType } from "formik";
import _ from "lodash";
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
import { useSessionStorage } from "usehooks-ts";

/** Common button props for the bulk edit/delete buttons */
function bulkButtonProps(ctx: FormikContextType<BulkSelectableFormValues>) {
  // Disable the button if none are selected:
  const disabled =
    !ctx.values.itemIdsToSelect ||
    !_.compact(Object.values(ctx.values.itemIdsToSelect)).length;
  return { disabled };
}

export interface AttachSelectedButtonProps {
  onAttachButtonClick: (selectedMetadatas: string[]) => Promise<void>;
}

export function AttachSelectedButton({
  onAttachButtonClick
}: AttachSelectedButtonProps) {
  return (
    <FormikButton
      className="btn btn-primary existing-objects-attach-button"
      onClick={async (values: BulkSelectableFormValues) => {
        const resourceIds = _.toPairs(values.itemIdsToSelect)
          .filter((pair) => pair[1])
          .map((pair) => pair[0]);
        await onAttachButtonClick(resourceIds);
      }}
      buttonProps={bulkButtonProps}
    >
      <CommonMessage id="attachSelected" />
    </FormikButton>
  );
}

export interface BulkDeleteButtonProps {
  typeName: string;
  apiBaseUrl: string;
  beforeDelete?: (resourceIds: string[]) => Promise<any>;
  afterDelete?: (
    resourceIds: string[],
    beforeDeleteResult?: any
  ) => Promise<void>;
}

export function BulkDeleteButton({
  apiBaseUrl,
  typeName,
  beforeDelete,
  afterDelete
}: BulkDeleteButtonProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const { apiClient } = useApiClient();

  return (
    <FormikButton
      buttonProps={bulkButtonProps}
      className="btn btn-danger bulk-delete-button"
      onClick={(values: BulkSelectableFormValues) => {
        const resourceIds = _.toPairs(values.itemIdsToSelect)
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
              // Execute pre-deletion logic if provided (e.g., fetch related resources)
              let beforeDeleteResult: any;
              if (beforeDelete) {
                beforeDeleteResult = await beforeDelete(resourceIds);
              }

              // Delete the records.
              for (const resourceId of resourceIds) {
                try {
                  await apiClient.axios.delete(
                    `${apiBaseUrl}/${typeName}/${resourceId}`
                  );
                } catch (e) {
                  // If it doesn't exist or has been deleted already, ignore it.
                  if (e.cause.status === 404 || e.cause.status === 410) {
                    console.warn(e.cause);
                  } else {
                    throw e;
                  }
                }
              }

              // Execute additional cleanup/related operations if provided
              if (afterDelete) {
                await afterDelete(resourceIds, beforeDeleteResult);
              }

              // Refresh the page:
              router.reload();
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
      className="btn btn-primary bulk-edit-button"
      onClick={async (values: BulkSelectableFormValues) => {
        const ids = _.toPairs(values.itemIdsToSelect)
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
  const [_exportObjectIds, setExportObjectIds] = useSessionStorage<string[]>(
    OBJECT_EXPORT_IDS_KEY,
    []
  );
  const [_, setTotalRecords] = useSessionStorage<number>(
    DATA_EXPORT_TOTAL_RECORDS_KEY,
    totalRecords
  );
  return (
    <FormikButton
      buttonProps={(_ctx) => ({ disabled: totalRecords === 0 })}
      className="btn btn-primary"
      onClick={async (values: BulkSelectableFormValues) => {
        const selectedResourceIds: string[] = values.itemIdsToSelect
          ? Object.keys(values.itemIdsToSelect)
          : [];
        const selectedIdsQuery = uuidQuery(selectedResourceIds);
        setExportObjectIds(selectedResourceIds);
        writeStorage<any>(
          DATA_EXPORT_QUERY_KEY,
          selectedResourceIds.length > 0 ? selectedIdsQuery : query
        );
        setTotalRecords(
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
        const ids = _.toPairs(values.itemIdsToSelect)
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
