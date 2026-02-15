import { writeStorage } from "@rehooks/local-storage";
import { FormikContextType } from "formik";
import _ from "lodash";
import { useRouter } from "next/router";
import {
  BulkSelectableFormValues,
  CommonMessage,
  DinaForm,
  FormikButton,
  SubmitButton,
  useApiClient,
  useModal
} from "..";
import { uuidQuery } from "../list-page/query-builder/query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { DynamicFieldsMappingConfig, TableColumn } from "../list-page/types";
import { KitsuResource } from "kitsu";
import { useSessionStorage } from "usehooks-ts";
import { MdEdit } from "react-icons/md";
import {
  FaCheck,
  FaExclamationTriangle,
  FaTimes,
  FaTrash
} from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { TbArrowsSplit2 } from "react-icons/tb";
import { useState } from "react";

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
  const { openModal } = useModal();

  return (
    <FormikButton
      buttonProps={bulkButtonProps}
      className="btn btn-danger bulk-delete-button"
      onClick={(values: BulkSelectableFormValues) => {
        const resourceIds = _.toPairs(values.itemIdsToSelect)
          .filter((pair) => pair[1])
          .map((pair) => pair[0]);

        openModal(
          <BulkDeletePopup
            resourceIds={resourceIds}
            apiBaseUrl={apiBaseUrl}
            typeName={typeName}
            beforeDelete={beforeDelete}
            afterDelete={afterDelete}
          />
        );
      }}
    >
      <FaTrash className="me-2" />
      <CommonMessage id="deleteSelectedButtonText" />
    </FormikButton>
  );
}
function BulkDeletePopup({
  resourceIds,
  apiBaseUrl,
  typeName,
  beforeDelete,
  afterDelete
}: { resourceIds: string[] } & BulkDeleteButtonProps) {
  const router = useRouter();
  const { closeModal } = useModal();
  const { apiClient } = useApiClient();

  const [permissionError, setPermissionError] = useState(false);
  const [generalError, setGeneralError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = resourceIds.length;
  const progressPercent = Math.round((currentIndex / total) * 100);
  const isError = permissionError || generalError;

  async function onDelete() {
    if (isError || isFinished) {
      closeModal();
      return;
    }

    setIsDeleting(true);
    let beforeDeleteResult: any;
    if (beforeDelete) {
      beforeDeleteResult = await beforeDelete(resourceIds);
    }

    for (let i = 0; i < resourceIds.length; i++) {
      const resourceId = resourceIds[i];
      setCurrentIndex(i);

      try {
        await apiClient.axios.delete(`${apiBaseUrl}/${typeName}/${resourceId}`);
      } catch (e: any) {
        setIsDeleting(false);
        const status = e?.cause?.status ?? e?.response?.status;

        if (status === 404 || status === 410) {
          console.warn(e);
        } else if (status === 403) {
          setPermissionError(true);
          return;
        } else {
          console.error(e);
          setGeneralError(true);
          return;
        }
      }
    }

    setCurrentIndex(total);
    setIsDeleting(false);
    setIsFinished(true);

    if (afterDelete) {
      await afterDelete(resourceIds, beforeDeleteResult);
    }
  }

  // Handle the final "Close and Refresh" action
  const handleFinish = () => {
    closeModal();
    router.reload();
  };

  return (
    <DinaForm
      initialValues={{}}
      onSubmit={isFinished ? handleFinish : onDelete}
    >
      <div className="modal-content are-you-sure-modal">
        {/* Dynamic Header */}
        <div className="modal-header">
          {isError ? (
            <div className="modal-title h3 text-danger">
              <FaExclamationTriangle className="me-2" />
              <CommonMessage id="somethingWentWrong" />
            </div>
          ) : isFinished ? (
            <div className="modal-title h3 text-success">
              <FaCheck className="me-2" />
              <CommonMessage id="deleteSuccess" values={{ count: total }} />
            </div>
          ) : (
            <div className="modal-title h3">
              <CommonMessage id="deleteSelectedButtonText" /> ({total})
            </div>
          )}
        </div>

        {/* Dynamic Body */}
        <div className="modal-body">
          <main>
            <div className="message-body text-center">
              {permissionError && (
                <div className="alert alert-danger">
                  <CommonMessage id="permissionError" />
                </div>
              )}

              {generalError && (
                <div className="alert alert-danger">
                  <CommonMessage id="somethingWentWrong" />
                </div>
              )}

              {isDeleting && !isError && (
                <div className="my-3">
                  <p>
                    Deleting {currentIndex + 1} of {total}...
                  </p>
                  <div className="progress" style={{ height: "25px" }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style={{ width: `${progressPercent}%` }}
                      aria-valuenow={progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      {progressPercent}%
                    </div>
                  </div>
                </div>
              )}

              {isFinished && (
                <div className="alert alert-success">
                  <p className="mb-0">
                    <strong>{total}</strong> records have been successfully
                    deleted.
                  </p>
                </div>
              )}

              {!isDeleting && !isFinished && !isError && (
                <p>
                  <CommonMessage id="areYouSure" />
                </p>
              )}
            </div>
          </main>
        </div>

        {/* Dynamic Footer */}
        <div className="modal-footer" style={{ justifyContent: "center" }}>
          <div className="d-flex gap-3">
            {isError || isFinished ? (
              <SubmitButton className="btn btn-primary" showSaveIcon={false}>
                <FaTimes className="me-2" />
                <CommonMessage id="closeButtonText" />
              </SubmitButton>
            ) : (
              <>
                <FormikButton
                  className="btn btn-dark no-button"
                  onClick={closeModal}
                  buttonProps={() => ({
                    style: { width: "10rem" },
                    disabled: isDeleting
                  })}
                >
                  <FaTimes className="me-2" />
                  <CommonMessage id="no" />
                </FormikButton>

                <SubmitButton
                  className="yes-button"
                  showSaveIcon={false}
                  buttonProps={() => ({
                    disabled: isDeleting
                  })}
                >
                  <FaCheck className="me-2" />
                  <CommonMessage id="yes" />
                </SubmitButton>
              </>
            )}
          </div>
        </div>
      </div>
    </DinaForm>
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
      <MdEdit className="me-2" />
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
      <FiDownload className="me-2" />
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
      <TbArrowsSplit2 className="me-2" />
      <CommonMessage id="splitSelectedButtonText" />
    </FormikButton>
  );
}
