import { writeStorage } from "@rehooks/local-storage";
import { FormikContextType, useFormikContext } from "formik";
import _ from "lodash";
import { useRouter } from "next/router";
import {
  BulkSelectableFormValues,
  CommonMessage,
  DinaForm,
  FormikButton,
  SubmitButton,
  Tooltip,
  useAccount,
  useApiClient,
  useModal
} from "..";
import { uuidQuery } from "../list-page/query-builder/query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { DynamicFieldsMappingConfig, TableColumn } from "../list-page/types";
import { KitsuResource } from "kitsu";
import { useSessionStorage } from "usehooks-ts";
import { useIntl } from "react-intl";
import { MdEdit } from "react-icons/md";
import {
  FaCheck,
  FaExclamationTriangle,
  FaTimes,
  FaTrash
} from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { TbArrowsSplit2 } from "react-icons/tb";
import { ReactNode, useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import {
  FaBolt,
  FaChevronDown,
  FaChevronUp,
  FaPaperclip
} from "react-icons/fa6";

/** Ids ticked in the table. */
const selectedIds = (
  itemIdsToSelect: BulkSelectableFormValues["itemIdsToSelect"]
) => _.keys(_.pickBy(itemIdsToSelect));

/** Common button props for the bulk edit/delete buttons */
function bulkButtonProps(
  ctx: FormikContextType<BulkSelectableFormValues>,
  forceDisabled?: boolean
) {
  // Disable the button if none are selected:
  const disabled =
    forceDisabled ||
    !ctx.values.itemIdsToSelect ||
    !_.compact(Object.values(ctx.values.itemIdsToSelect)).length;
  return { disabled, "aria-disabled": disabled };
}

const NO_DENIED = { update: [] as string[], delete: [] as string[] };

/**
 * While the menu is open, finds the distinct groups of the selected records and asks the API which
 * of them the user may not update/delete. Group is the only thing permissions depend on for list
 * pages, so that is one check per group rather than per record. Admins are always allowed.
 */
function useSelectionPermissions(
  enabled: boolean,
  ids: string[],
  indexName?: string,
  target?: { apiBaseUrl: string; typeName: string }
) {
  const { apiClient } = useApiClient();
  const { isAdmin } = useAccount();
  const [state, setState] = useState({ loading: false, denied: NO_DENIED });
  const key = ids.join(",");

  useEffect(() => {
    if (!enabled || isAdmin || !ids.length || !indexName || !target) {
      setState({ loading: false, denied: NO_DENIED });
      return;
    }
    let cancelled = false;
    setState({ loading: true, denied: NO_DENIED });
    (async () => {
      try {
        // Aggregation returns only the distinct groups, however many records are selected:
        const { data } = await apiClient.axios.post(
          "search-api/search-ws/search",
          {
            ...uuidQuery(ids),
            size: 0,
            aggs: {
              groups: { terms: { field: "data.attributes.group", size: 100 } }
            }
          },
          { params: { indexName } }
        );
        const groups: string[] = _.compact(
          _.values(data?.aggregations)[0]?.buckets?.map((bucket) => bucket.key)
        );
        const granted = await Promise.all(
          groups.map(async (group) => {
            const res = await apiClient.axios.post(
              `${target.apiBaseUrl}/permission-check`,
              { data: { type: target.typeName, attributes: { group } } }
            );
            return [
              group,
              res.data?.data?.attributes?.permissions ?? []
            ] as const;
          })
        );
        const lacking = (permission: string) =>
          granted.filter(([, p]) => !p.includes(permission)).map(([g]) => g);
        if (!cancelled) {
          setState({
            loading: false,
            denied: { update: lacking("update"), delete: lacking("delete") }
          });
        }
      } catch (e) {
        // The API still enforces permissions on save, so don't block the menu on a failed check.
        console.warn(e);
        if (!cancelled) {
          setState({ loading: false, denied: NO_DENIED });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, isAdmin, key, indexName, target?.apiBaseUrl, target?.typeName]);

  return state;
}

export interface BulkActionsDropdownProps<TData extends KitsuResource> {
  /** Search index used to look up the selected records' groups for the permission check. */
  indexName?: string;
  edit?: BulkEditButtonProps;
  split?: BulkSplitButtonProps;
  dataExport?: DataExportButtonProps<TData>;
  del?: BulkDeleteButtonProps;
}

/** Single menu holding the bulk edit/split/export/delete buttons. */
export function BulkActionsDropdown<TData extends KitsuResource>({
  indexName,
  edit,
  split,
  dataExport,
  del
}: BulkActionsDropdownProps<TData>) {
  const { values } = useFormikContext<BulkSelectableFormValues>();
  const { formatMessage } = useIntl();
  const [open, setOpen] = useState(false);
  const ids = selectedIds(values.itemIdsToSelect);
  const count = ids.length;
  const { loading, denied } = useSelectionPermissions(
    open,
    ids,
    indexName,
    del
  );

  // Tooltip shown on rows that need a permission the user lacks:
  const warning = (kind: "update" | "delete", id: string) =>
    denied[kind].length
      ? { id, intlValues: { groups: denied[kind].join(", ") } }
      : undefined;
  const editWarning = warning("update", "noEditPermission");
  const deleteWarning = warning("delete", "noDeletePermission");
  const withWarning = (
    button: ReactNode,
    tooltip?: { id: string; intlValues: Record<string, string> }
  ) =>
    tooltip ? (
      <div className="position-relative">
        {button}
        <span className="position-absolute top-50 end-0 translate-middle-y me-3">
          <Tooltip
            {...tooltip}
            placement="left"
            disableSpanMargin
            visibleElement={<FaExclamationTriangle className="text-warning" />}
          />
        </span>
      </div>
    ) : (
      button
    );
  const Chevron = open ? FaChevronUp : FaChevronDown;
  const itemClass = "dropdown-item d-flex align-items-center fw-bold py-2";
  const groupLabelClass = "px-3 pt-2 pb-1 small fw-bold text-uppercase";

  return (
    <Dropdown className="bulk-actions-dropdown" show={open} onToggle={setOpen}>
      <Dropdown.Toggle variant="primary" bsPrefix="actions-toggle">
        <FaBolt className="me-2" />
        {count ? (
          <CommonMessage id="actionsOnSelected" values={{ count }} />
        ) : (
          <CommonMessage id="actions" />
        )}
        <Chevron className="ms-2" />
      </Dropdown.Toggle>
      <Dropdown.Menu
        align="end"
        renderOnMount
        className="py-0"
        style={{ width: "340px" }}
      >
        {/* Clicking an action closes the menu. */}
        <div onClick={() => setOpen(false)}>
          <div className={`${groupLabelClass} text-muted`}>
            {count ? (
              <CommonMessage id="onSelectedCount" values={{ count }} />
            ) : (
              <CommonMessage id="onSelected" />
            )}
            {loading && (
              <Tooltip
                id="checkingPermissions"
                placement="left"
                disableSpanMargin
                className="ms-2"
                visibleElement={
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-label={formatMessage({ id: "checkingPermissions" })}
                  />
                }
              />
            )}
          </div>
          <div className="bulk-actions-rows">
            {edit &&
              withWarning(
                <BulkEditButton
                  {...edit}
                  className={itemClass}
                  disabled={loading || !!editWarning}
                />,
                editWarning
              )}
            {split && <BulkSplitButton {...split} className={itemClass} />}
            {dataExport && (
              <DataExportButton {...dataExport} className={itemClass} />
            )}
            {del &&
              withWarning(
                <BulkDeleteButton
                  {...del}
                  className={`${itemClass} ${
                    count && !loading && !deleteWarning ? "text-danger" : ""
                  }`}
                  disabled={loading || !!deleteWarning}
                />,
                deleteWarning
              )}
          </div>
          {dataExport && (
            <div className="border-top">
              <div className={`${groupLabelClass} text-muted`}>
                <CommonMessage
                  id="onAllMatched"
                  values={{ total: dataExport.totalRecords.toLocaleString() }}
                />
              </div>
              <DataExportButton
                {...dataExport}
                exportAll
                className={itemClass}
              />
            </div>
          )}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
}

/** Suffix for the total matched records line. */
export function SelectedCountText() {
  const { values } = useFormikContext<BulkSelectableFormValues>();
  return (
    <CommonMessage
      id="tableSelectedSuffix"
      values={{ count: selectedIds(values.itemIdsToSelect).length }}
    />
  );
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
      <FaPaperclip className="me-2" />
      <CommonMessage id="attachSelected" />
    </FormikButton>
  );
}

export interface BulkDeleteButtonProps {
  /** Overrides the default button styling, e.g. to render as a dropdown item. */
  className?: string;
  /** Force the button disabled, e.g. while permissions are being checked. */
  disabled?: boolean;
  typeName: string;
  apiBaseUrl: string;
  beforeDelete?: (resourceIds: string[]) => Promise<any>;
  afterDelete?: (
    resourceIds: string[],
    beforeDeleteResult?: any
  ) => Promise<void>;
}

export function BulkDeleteButton({
  className = "btn btn-danger",
  disabled,
  apiBaseUrl,
  typeName,
  beforeDelete,
  afterDelete
}: BulkDeleteButtonProps) {
  const { openModal } = useModal();

  return (
    <FormikButton
      buttonProps={(ctx) => bulkButtonProps(ctx, disabled)}
      className={`${className} bulk-delete-button`}
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
  /** Overrides the default button styling, e.g. to render as a dropdown item. */
  className?: string;
  /** Force the button disabled, e.g. while permissions are being checked. */
  disabled?: boolean;
}

/**
 * Key value where the bulk edit ids will be stored.
 *
 * This constant is available to use for setting and retrieving the value.
 */
export const BULK_EDIT_IDS_KEY = "bulkEditIds";

export function BulkEditButton({
  pathname,
  singleEditPathName,
  className = "btn btn-primary",
  disabled
}: BulkEditButtonProps) {
  const router = useRouter();

  return (
    <FormikButton
      buttonProps={(ctx) => bulkButtonProps(ctx, disabled)}
      className={`${className} bulk-edit-button`}
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
  className?: string;
  /** Export every matching record, ignoring the current selection. */
  exportAll?: boolean;
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
  entityLink,
  className = "btn btn-primary",
  exportAll
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
      buttonProps={(ctx) => {
        const disabled =
          totalRecords === 0 ||
          (!exportAll && !selectedIds(ctx.values.itemIdsToSelect).length);
        return { disabled, "aria-disabled": disabled };
      }}
      className={className}
      onClick={async (values: BulkSelectableFormValues) => {
        const selectedResourceIds = exportAll
          ? []
          : selectedIds(values.itemIdsToSelect);
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
      <CommonMessage
        id={exportAll ? "exportAllMatching" : "exportSelectedButtonText"}
      />
    </FormikButton>
  );
}

export interface BulkSplitButtonProps {
  /**
   * Page where the bulk split is being performed.
   */
  pathname: string;
  className?: string;
}

/**
 * String key for the local storage of the bulk split ids.
 */
export const BULK_SPLIT_IDS = "";

export function BulkSplitButton({
  pathname,
  className = "btn btn-primary"
}: BulkSplitButtonProps) {
  const router = useRouter();

  return (
    <FormikButton
      buttonProps={bulkButtonProps}
      className={`${className} bulk-split-button`}
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
