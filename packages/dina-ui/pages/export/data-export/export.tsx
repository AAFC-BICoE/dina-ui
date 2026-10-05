import { useLocalStorage } from "@rehooks/local-storage";
import classNames from "classnames";
import { KitsuResource, PersistedResource } from "kitsu";
import { get } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  BackButton,
  ColumnSelectorMemo,
  CommonMessage,
  DATA_EXPORT_DYNAMIC_FIELD_MAPPING_KEY,
  DATA_EXPORT_QUERY_KEY,
  DATA_EXPORT_TOTAL_RECORDS_KEY,
  DinaForm,
  FieldSet,
  OBJECT_EXPORT_IDS_KEY,
  SaveArgs,
  SubmitButton,
  TextField,
  Tooltip,
  useApiClient
} from "common-ui";
import {
  convertColumnsToAliases,
  convertColumnsToPaths,
  getColumnFunctions,
  getEntityKeyFromIndexName
} from "common-ui/lib/column-selector/ColumnSelectorUtils";
import {
  MAX_MATERIAL_SAMPLES_FOR_MOLECULAR_ANALYSIS_EXPORT,
  MAX_OBJECT_EXPORT_TOTAL
} from "common-ui/lib/export/exportUtils";
import { QueryFieldSelector } from "common-ui/lib/list-page/query-builder/query-builder-core-components/QueryFieldSelector";
import QueryRowManagedAttributeSearch from "common-ui/lib/list-page/query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";
import {
  DynamicFieldsMappingConfig,
  ESIndexMapping
} from "common-ui/lib/list-page/types";
import { useIndexMapping } from "common-ui/lib/list-page/useIndexMapping";
import PageLayout from "dina-ui/components/page/PageLayout";
import { DinaMessage } from "dina-ui/intl/dina-ui-intl";
import {
  ColumnSeparator,
  DataExport,
  DataExportTemplate,
  ExportType
} from "dina-ui/types/dina-export-api";
import { Metadata, ObjectExport } from "dina-ui/types/objectstore-api";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { FaFileExport, FaHistory, FaTrash } from "react-icons/fa";
import { useIntl } from "react-intl";
import Select from "react-select";
import { useSessionStorage } from "usehooks-ts";
import { MATERIAL_SAMPLE_NON_EXPORTABLE_COLUMNS } from "../../collection/material-sample/list";
import { OBJECT_STORE_NON_EXPORTABLE_COLUMNS } from "../../object-store/object/list";
import useSavedExports, { VISIBILITY_OPTIONS } from "./useSavedExports";
import { ExportPopup } from "@dina-ui/components/export/ExportPopup";

export interface SavedExportOption {
  label?: string;
  value?: string;
  resource?: DataExportTemplate;
}

const SEPARATOR_OPTIONS: { value: ColumnSeparator; label: string }[] = [
  {
    value: "COMMA",
    label: "Comma"
  },
  {
    value: "TAB",
    label: "Tab"
  }
];

const RESIZE_OPTIONS = [
  { value: 100, label: "100% - Original size" },
  { value: 90, label: "90%" },
  { value: 80, label: "80%" },
  { value: 70, label: "70%" },
  { value: 60, label: "60%" },
  { value: 50, label: "50%" },
  { value: 40, label: "40%" },
  { value: 30, label: "30%" },
  { value: 20, label: "20%" },
  { value: 10, label: "10%" }
];

/** Which file of each image object is exported: the original or one of its derivatives. */
type ExportImageType = "ORIGINAL" | "LARGE_IMAGE" | "THUMBNAIL_IMAGE";

const IMAGE_TYPES: ExportImageType[] = [
  "ORIGINAL",
  "LARGE_IMAGE",
  "THUMBNAIL_IMAGE"
];

const NON_EXPORTABLE_COLUMNS_MAP: { [key: string]: string[] } = {
  ["dina_material_sample_index"]: MATERIAL_SAMPLE_NON_EXPORTABLE_COLUMNS,
  ["dina_object_store_index"]: OBJECT_STORE_NON_EXPORTABLE_COLUMNS
};

/**
 * Returns the file that will be exported for an object: the requested image derivative when the
 * object has one, otherwise the original file.
 */
function getExportFile(
  metadata: PersistedResource<Metadata>,
  imageType: ExportImageType
): { fileIdentifier?: string; dcFormat?: string; fileExtension?: string } {
  if (imageType !== "ORIGINAL") {
    const derivative = metadata?.derivatives?.find(
      (it) => it.derivativeType === imageType
    );
    if (derivative) {
      return derivative;
    }
  }
  return metadata;
}

function isJpegFile(file: { dcFormat?: string; fileExtension?: string }) {
  const ext = file.fileExtension?.toLowerCase();
  return file.dcFormat === "image/jpeg" || ext === ".jpg" || ext === ".jpeg";
}

interface ExportTypeCardProps {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: ReactNode;
  description: ReactNode;
}

/** Card that behaves like a radio button for choosing the export type. */
function ExportTypeCard({
  id,
  checked,
  disabled,
  onSelect,
  title,
  description
}: ExportTypeCardProps) {
  return (
    <label
      htmlFor={id}
      className={classNames(
        "export-type-card",
        checked && "selected",
        disabled && "disabled"
      )}
    >
      <input
        id={id}
        type="radio"
        name="exportType"
        className="form-check-input"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
      />
      <span>
        <span className="d-block fw-bold">{title}</span>
        <span className="d-block export-type-card-description">
          {description}
        </span>
      </span>
    </label>
  );
}

export default function ExportPage<TData extends KitsuResource>() {
  const { formatNumber, formatMessage } = useIntl();
  const { bulkGet, save } = useApiClient();
  const router = useRouter();

  // Unique name to be used for the local storage.
  const uniqueName = String(router.query.uniqueName);

  // Index mapping name to retrieve all the possible fields.
  const indexName = String(router.query.indexName);

  // Determines where the back button should link to.
  const entityLink = String(router.query.entityLink);

  // ElasticSearch query to be used to perform the export against.
  const [queryObject] = useLocalStorage<object>(DATA_EXPORT_QUERY_KEY);

  // The total number of results that will be exported.
  const [totalRecords] = useSessionStorage<number>(
    DATA_EXPORT_TOTAL_RECORDS_KEY,
    0
  );

  // State holding the current export type. For example, Data export / Object export.
  const [exportType, setExportType] = useState<ExportType>("TABULAR_DATA");

  // Only available through the object export (all objects need to be images), which file of each
  // image to export.
  const [imageType, setImageType] = useState<ExportImageType>("LARGE_IMAGE");

  // Only available through the object export (all exported files need to be JPEG), the scale to
  // apply to the export.
  const [resizePercentage, setResizePercentage] = useState<number>(100);

  // Metadata of the selected objects, loaded when switching to OBJECT_ARCHIVE export.
  const [objectMetadatas, setObjectMetadatas] =
    useState<PersistedResource<Metadata>[]>();
  const [loadingObjectMetadatas, setLoadingObjectMetadatas] = useState(false);

  // State to determine if the export API request has been submitted.
  const [exportRequestSubmitted, setExportRequestSubmitted] = useState(false);

  // Local storage for Export Objects
  const [localStorageExportObjectIds] = useSessionStorage<string[]>(
    OBJECT_EXPORT_IDS_KEY,
    []
  );

  // Dynamic mappings from the list page to be applied for the export.
  const [dynamicFieldMapping] = useLocalStorage<
    DynamicFieldsMappingConfig | undefined
  >(`${uniqueName}_${DATA_EXPORT_DYNAMIC_FIELD_MAPPING_KEY}`, undefined);

  const [dataExportError, setDataExportError] = useState<ReactNode>();
  const [loading, setLoading] = useState(false);
  const [selectedSeparator, setSelectedSeparator] = useState<{
    value: ColumnSeparator;
    label: string;
  }>({
    value: "COMMA",
    label: "Comma"
  });

  const submitButtonRef = useRef(null);

  const { indexMap } = useIndexMapping({
    indexName,
    dynamicFieldMapping
  });

  if (indexMap && !indexMap.find((im) => im.label === "resourceExternalURL")) {
    indexMap.push({
      path: "data.attributes",
      value: "data.attributes.externalResourceURL",
      label: "resourceExternalURL",
      hideField: false,
      type: "string",
      containsSupport: false,
      endsWithSupport: false,
      dynamicField: undefined,
      distinctTerm: false,
      optimizedPrefix: false
    } as ESIndexMapping);
  }

  async function fetchObjectMetadatas() {
    const paths = localStorageExportObjectIds.map(
      (id) => `metadata/${id}?include=derivatives`
    );
    return await bulkGet<Metadata>(paths, {
      apiBaseUrl: "/objectstore-api"
    });
  }

  // Load the selected objects when switching to OBJECT_ARCHIVE export, to know which image options
  // apply to them.
  useEffect(() => {
    async function loadObjectMetadatas() {
      if (
        exportType === "OBJECT_ARCHIVE" &&
        localStorageExportObjectIds.length > 0
      ) {
        setLoadingObjectMetadatas(true);
        try {
          setObjectMetadatas(
            (await fetchObjectMetadatas()) as PersistedResource<Metadata>[]
          );
        } catch {
          setObjectMetadatas(undefined);
        }
        setLoadingObjectMetadatas(false);
      } else {
        setObjectMetadatas(undefined);
      }
    }

    loadObjectMetadatas();
  }, [exportType, localStorageExportObjectIds]);

  // Image Type and Resize Images apply to every object, so they are only offered when every object
  // is an image. Otherwise the original files are exported.
  const imageOptionsAvailable =
    !!objectMetadatas?.length &&
    objectMetadatas.every((meta) => meta.dcType === "IMAGE");
  const exportImageType: ExportImageType = imageOptionsAvailable
    ? imageType
    : "ORIGINAL";

  // Resizing is only supported when every exported file is a JPEG.
  const resizeAvailable =
    imageOptionsAvailable &&
    objectMetadatas.every((meta) =>
      isJpegFile(getExportFile(meta, exportImageType))
    );
  const exportResizePercentage = resizeAvailable ? resizePercentage : 100;

  // The selected field from the query field selector.
  const [selectedFilenameAliasField, setSelectedFilenameAliasField] =
    useState<ESIndexMapping>();

  // Used for dynamic fields to store the specific dynamic value selected.
  const [dynamicFieldValue, setDynamicFieldValue] = useState<string>();

  const {
    allSavedExports,
    loadingSavedExports,
    loadingDelete,
    loadingUpdate,
    changesMade,
    setChangesMade,
    setSelectedSavedExport,
    selectedSavedExport,
    ModalElement,
    handleShowCreateSavedExportModal,
    columnsToExport,
    setColumnsToExport,
    columnPathsToExport,
    setColumnPathsToExport,
    deleteSavedExport,
    updateSavedExport,
    setRestrictToCreatedBy,
    setPubliclyReleaseable
  } = useSavedExports<TData>({ exportType, selectedSeparator, entityLink });

  const nonExportableColumns: string[] =
    NON_EXPORTABLE_COLUMNS_MAP?.[indexName] ?? [];

  async function exportData(formik) {
    setLoading(true);

    // Clear error message.
    setDataExportError(undefined);

    // Prepare the query to be used for exporting purposes.
    if (queryObject) {
      delete (queryObject as any)._source;
    }
    const queryString = JSON.stringify(queryObject)?.replace(/"/g, '"');

    const columnFunctions = getColumnFunctions<TData>(columnsToExport);

    // Non-exportable columns filtering
    // managed attribute columns are exempt from non-exportable
    // since they are explicitly chosen by the user and have well-defined export path
    const filteredColumns = columnsToExport.filter(
      (column) =>
        (column as any)?.managedAttribute ||
        !nonExportableColumns.some((prefix) =>
          (column?.id ?? "").startsWith(prefix)
        )
    );

    // Get entity key from index name (e.g., "dina_material_sample_index" -> "material-sample")
    const entityKey = getEntityKeyFromIndexName(indexName);

    // Make query to data-export
    const dataExportSaveArg: SaveArgs<DataExport> = {
      resource: {
        type: "data-export",
        source: indexName,
        query: queryString,
        schema: {
          [entityKey]: {
            columns: convertColumnsToPaths(filteredColumns),
            aliases: convertColumnsToAliases(filteredColumns)
          }
        },
        functions:
          Object.keys(columnFunctions ?? {}).length === 0
            ? undefined
            : columnFunctions,
        name: formik?.values?.name,
        exportOptions: {
          columnSeparator: selectedSeparator?.value
        }
      },
      type: "data-export"
    };

    await save<DataExport>([dataExportSaveArg], {
      apiBaseUrl: "/dina-export-api"
    });

    // Display export request submitted message to user after submitting export request
    setExportRequestSubmitted(true);

    setLoading(false);
  }

  // Function to export and download Objects
  async function exportObjects(formik) {
    setLoading(true);

    // Clear error message.
    setDataExportError(undefined);

    try {
      const metadatas = (objectMetadatas ??
        (await fetchObjectMetadatas())) as PersistedResource<Metadata>[];

      const exportFiles = metadatas.map((metadata) =>
        getExportFile(metadata, exportImageType)
      );

      const filenameAliases = {};

      if (selectedFilenameAliasField) {
        metadatas.forEach((metadata, index) => {
          const filenameAlias: string =
            selectedFilenameAliasField.label === "managedAttributes" &&
            dynamicFieldValue
              ? get(
                  metadata,
                  JSON.parse(dynamicFieldValue).selectedManagedAttributeConfig
                    .label
                )
              : get(metadata, selectedFilenameAliasField.label);
          const fileIdentifier = exportFiles[index].fileIdentifier;
          if (fileIdentifier) {
            filenameAliases[fileIdentifier] = filenameAlias;
          }
        });
      }

      const hasFilenameAliases = Object.keys(filenameAliases).length > 0;

      const objectExportSaveArg = {
        resource: {
          type: "object-export",
          fileIdentifiers: exportFiles.map((file) => file.fileIdentifier),
          name: formik?.values?.name,
          ...(hasFilenameAliases ? { filenameAliases } : {}),
          ...(exportResizePercentage < 100
            ? {
                exportFunction: {
                  functionDef: "IMG_RESIZE",
                  params: {
                    factor: (exportResizePercentage / 100).toString()
                  }
                }
              }
            : {})
        },
        type: "object-export"
      };

      await save<ObjectExport>([objectExportSaveArg], {
        apiBaseUrl: "/objectstore-api"
      });
    } catch (e) {
      setDataExportError(
        <div className="alert alert-danger">{e?.message ?? e.toString()}</div>
      );
    }

    // Display export request submitted message to user after submitting export request
    setExportRequestSubmitted(true);

    setLoading(false);
  }

  const displayManagedAttributes =
    selectedFilenameAliasField?.dynamicField?.type === "managedAttribute";

  const LoadingSpinner = (
    <>
      <Spinner
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
      />
      <span className="visually-hidden">
        <DinaMessage id="loadingSpinner" />
      </span>
    </>
  );

  const disableObjectExportButton =
    localStorageExportObjectIds.length < 1 ||
    totalRecords > MAX_OBJECT_EXPORT_TOTAL;

  const imageTypeLabel = (type: ExportImageType) =>
    formatMessage({ id: `exportImageType_${type}` as any });
  const imageTypeDropdownLabel = (type: ExportImageType) =>
    type === "ORIGINAL"
      ? imageTypeLabel(type)
      : formatMessage({ id: `exportImageType_${type}_DERIVATIVE` as any });
  const imageTypeOptions = IMAGE_TYPES.map((type) => ({
    value: type,
    label: imageTypeDropdownLabel(type)
  }));
  const resizeLabel =
    RESIZE_OPTIONS.find((option) => option.value === exportResizePercentage)
      ?.label ?? `${exportResizePercentage}%`;

  // While the objects are loading, keep the image options disabled without claiming mixed media.
  const imageOptionsPlaceholder = loadingObjectMetadatas ? undefined : (
    <DinaMessage id="exportImageOptionsUnavailable" />
  );

  const savedExportOptions: SavedExportOption[] = allSavedExports.map(
    (option) => ({
      value: option.name,
      label: option.name,
      resource: option
    })
  );

  const settingsFields =
    exportType === "TABULAR_DATA" ? (
      <div className="row">
        <div className="col-md-6">
          <TextField name={"name"} customName="exportName" disabled={loading} />
        </div>
        <div className="col-md-6 mb-3">
          <label className="d-block mb-2">
            <strong>
              <DinaMessage id="separator" />
            </strong>
          </label>
          <Select<{ value: ColumnSeparator; label: string }>
            name="separator"
            options={SEPARATOR_OPTIONS}
            onChange={(selection) => {
              if (selection) {
                setSelectedSeparator(selection);
                if (selectedSavedExport) {
                  setChangesMade(true);
                }
              }
            }}
            isLoading={loadingSavedExports}
            isDisabled={loading}
            value={selectedSeparator}
          />
        </div>
        <div className="col-md-6 mb-3">
          <label className="d-block mb-2">
            <strong>
              <DinaMessage id="savedExport_exportDropdown" />
            </strong>
          </label>
          <div className="d-flex gap-2">
            <Select<SavedExportOption>
              className="flex-grow-1"
              name="savedExportOption"
              options={savedExportOptions}
              onChange={(selection) => {
                if (selection && selection.resource) {
                  setSelectedSavedExport(selection.resource);
                  const separator = SEPARATOR_OPTIONS.find(
                    (option) =>
                      option.value ===
                      selection.resource?.exportOptions?.columnSeparator
                  );
                  if (separator) {
                    setSelectedSeparator(separator);
                  }
                }
              }}
              isLoading={loadingSavedExports}
              isDisabled={loading}
              value={
                savedExportOptions.find(
                  (option) => option.value === selectedSavedExport?.name
                ) ?? null
              }
            />
            {selectedSavedExport && (
              <Button
                variant="danger"
                onClick={deleteSavedExport}
                disabled={loadingDelete || loading}
                aria-label={formatMessage({ id: "deleteButtonText" })}
              >
                {loadingDelete ? LoadingSpinner : <FaTrash />}
              </Button>
            )}
          </div>
        </div>
        {selectedSavedExport && (
          <div className="col-md-6 mb-3">
            <label className="d-block mb-2">
              <strong>
                <DinaMessage id="visibility" />
              </strong>
            </label>
            <Select<{
              label: React.JSX.Element;
              value: {
                restrictToCreatedBy: boolean;
                publiclyReleasable: boolean;
              };
            }>
              name="visibility"
              options={VISIBILITY_OPTIONS}
              onChange={(selected) => {
                setRestrictToCreatedBy(selected!.value.restrictToCreatedBy);
                setPubliclyReleaseable(selected!.value.publiclyReleasable);
                setChangesMade(true);
              }}
              value={VISIBILITY_OPTIONS.find(
                (option) =>
                  selectedSavedExport.publiclyReleasable ===
                    option.value.publiclyReleasable &&
                  selectedSavedExport.restrictToCreatedBy ===
                    option.value.restrictToCreatedBy
              )}
            />
          </div>
        )}
        {selectedSavedExport && changesMade && (
          <div className="col-12 mb-3">
            <Button
              variant="primary"
              onClick={updateSavedExport}
              disabled={loadingUpdate || loading}
            >
              {loadingUpdate ? (
                LoadingSpinner
              ) : (
                <DinaMessage id="saveChanges" />
              )}
            </Button>
          </div>
        )}
      </div>
    ) : (
      <div className="row">
        <div className="col-md-6">
          <TextField name={"name"} customName="exportName" disabled={loading} />
        </div>
        <div className="col-md-6 mb-3">
          <label className="d-block mb-2">
            <strong>
              <DinaMessage id="fileNameAliasField" />
            </strong>
          </label>
          <QueryFieldSelector
            indexMap={indexMap as ESIndexMapping[]}
            currentField={selectedFilenameAliasField?.value}
            setField={(path) => {
              if (indexMap) {
                const columnIndex = indexMap.find(
                  (index) => index.value === path
                );
                if (columnIndex) {
                  setSelectedFilenameAliasField(columnIndex);
                }
              }
            }}
            isInColumnSelector={false}
          />
          {displayManagedAttributes && (
            <div className="mt-3">
              <QueryRowManagedAttributeSearch
                indexMap={indexMap}
                managedAttributeConfig={selectedFilenameAliasField}
                isInColumnSelector={true}
                setValue={setDynamicFieldValue}
                value={dynamicFieldValue}
              />
            </div>
          )}
        </div>
      </div>
    );

  const summary = (
    <aside
      className={classNames(
        "export-summary",
        uniqueName === "object-store-list" && "below-section-label"
      )}
    >
      <div className="export-summary-header">
        <DinaMessage id="exportSummary" />
      </div>
      <dl className="export-summary-list">
        <dt>
          <DinaMessage id="exportSummary_records" />
        </dt>
        <dd>{formatNumber(totalRecords ?? 0)}</dd>
        <dt>
          <DinaMessage id="exportSummary_output" />
        </dt>
        <dd>
          {exportType === "OBJECT_ARCHIVE" ? (
            <DinaMessage id="exportSummary_outputZip" />
          ) : selectedSeparator.value === "TAB" ? (
            <DinaMessage id="exportSummary_outputTsv" />
          ) : (
            <DinaMessage id="exportSummary_outputCsv" />
          )}
        </dd>
        {exportType === "TABULAR_DATA" && (
          <>
            <dt>
              <DinaMessage id="exportSummary_template" />
            </dt>
            <dd>
              {selectedSavedExport?.name ?? (
                <DinaMessage id="exportSummary_templateNone" />
              )}
            </dd>
          </>
        )}
        {exportType === "OBJECT_ARCHIVE" && (
          <>
            <dt>
              <DinaMessage id="exportSummary_images" />
            </dt>
            <dd>
              {loadingObjectMetadatas ? (
                LoadingSpinner
              ) : imageOptionsAvailable ? (
                <DinaMessage
                  id="exportSummary_imagesValue"
                  values={{
                    imageType: imageTypeLabel(exportImageType),
                    resize: resizeLabel
                  }}
                />
              ) : (
                <DinaMessage id="exportSummary_imagesUnavailable" />
              )}
            </dd>
          </>
        )}
      </dl>
      <div className="export-summary-footer">
        <div ref={submitButtonRef}>
          <SubmitButton
            buttonProps={(formik) => ({
              style: { width: "100%" },
              disabled: loading || exportRequestSubmitted,
              onClick: () => {
                if (exportType === "TABULAR_DATA") {
                  exportData(formik);
                } else {
                  exportObjects(formik);
                }
              }
            })}
          >
            {loading ? (
              LoadingSpinner
            ) : exportType === "TABULAR_DATA" ? (
              <DinaMessage
                id="exportRecordsButton"
                values={{ count: totalRecords ?? 0 }}
              />
            ) : (
              <DinaMessage
                id="exportObjectsCountButton"
                values={{ count: localStorageExportObjectIds.length }}
              />
            )}
          </SubmitButton>
          <ExportPopup
            target={submitButtonRef.current}
            show={exportRequestSubmitted}
            onClose={() => setExportRequestSubmitted(false)}
            placement="left"
          />
        </div>
        {exportType === "OBJECT_ARCHIVE" && disableObjectExportButton && (
          <div className="form-text mt-0">
            <CommonMessage id="exportObjectsMaxLimitTooltip" />
          </div>
        )}
        {exportType === "TABULAR_DATA" && (
          <button
            className="btn btn-outline-primary w-100"
            type="button"
            onClick={handleShowCreateSavedExportModal}
            disabled={loadingSavedExports || loading}
          >
            <DinaMessage id="savedExport_createTitle" />
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {ModalElement}
      <PageLayout
        titleId="exportButtonText"
        buttonBarContent={
          <>
            <div className="col-md-6 col-sm-12 mt-2">
              <BackButton
                className="me-auto"
                entityLink={entityLink}
                byPassView={true}
              />
            </div>
            <div className="col-md-6 col-sm-12 d-flex">
              {totalRecords >
              MAX_MATERIAL_SAMPLES_FOR_MOLECULAR_ANALYSIS_EXPORT ? (
                <Tooltip
                  directComponent={
                    <DinaMessage
                      id="molecularAnalysisExportMaxMaterialSampleError"
                      values={{
                        limit:
                          MAX_MATERIAL_SAMPLES_FOR_MOLECULAR_ANALYSIS_EXPORT
                      }}
                    />
                  }
                  placement={"bottom"}
                  className="ms-auto"
                  visibleElement={
                    <div className="btn btn-primary disabled">
                      <DinaMessage id="molecularAnalysisExport" />
                    </div>
                  }
                />
              ) : (
                <Link
                  href={`/export/molecular-analysis-export/export?entityLink=${entityLink}`}
                  className="btn btn-primary ms-auto"
                >
                  <FaFileExport size={18} style={{ marginRight: "8px" }} />
                  <DinaMessage id="molecularAnalysisExport" />
                </Link>
              )}
              <Link
                href={`/export/data-export/list?entityLink=${entityLink}`}
                className="btn btn-primary ms-2"
              >
                <FaHistory size={18} style={{ marginRight: "8px" }} />
                <DinaMessage id="viewExportHistoryButton" />
              </Link>
            </div>
          </>
        }
      >
        <DinaForm initialValues={{}}>
          {dataExportError}
          <div className="export-page-grid mt-3">
            <div>
              {uniqueName === "object-store-list" && (
                <div
                  className="mb-4"
                  role="radiogroup"
                  aria-labelledby="export-type-label"
                >
                  <div id="export-type-label" className="export-section-label">
                    <DinaMessage id="savedExport_exportType" />
                  </div>
                  <div className="export-type-cards">
                    <ExportTypeCard
                      id="export-data"
                      checked={exportType === "TABULAR_DATA"}
                      disabled={loading}
                      onSelect={() => setExportType("TABULAR_DATA")}
                      title={<DinaMessage id="dataLabel" />}
                      description={
                        <DinaMessage id="exportType_dataDescription" />
                      }
                    />
                    <ExportTypeCard
                      id="export-object"
                      checked={exportType === "OBJECT_ARCHIVE"}
                      disabled={loading}
                      onSelect={() => setExportType("OBJECT_ARCHIVE")}
                      title={<DinaMessage id="objectsLabel" />}
                      description={
                        <DinaMessage id="exportType_objectsDescription" />
                      }
                    />
                  </div>
                </div>
              )}

              <FieldSet legend={<DinaMessage id="settingLabel" />}>
                {settingsFields}
              </FieldSet>

              {exportType === "OBJECT_ARCHIVE" && (
                <FieldSet
                  className="export-image-processing"
                  legend={<DinaMessage id="exportImageProcessing" />}
                >
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="d-flex align-items-center mb-2">
                        <strong>
                          <DinaMessage id="exportImageTypeLabel" />
                        </strong>
                        <Tooltip id="exportImageTypeTooltip" className="ms-2" />
                      </label>
                      <Select<{ value: ExportImageType; label: string }>
                        name="imageType"
                        options={imageTypeOptions}
                        onChange={(selection) => {
                          if (selection) {
                            setImageType(selection.value);
                          }
                        }}
                        isLoading={loadingObjectMetadatas}
                        isDisabled={loading || !imageOptionsAvailable}
                        placeholder={imageOptionsPlaceholder}
                        classNamePrefix="react-select"
                        value={
                          imageOptionsAvailable
                            ? imageTypeOptions.find(
                                (option) => option.value === imageType
                              )
                            : null
                        }
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="d-flex align-items-center mb-2">
                        <strong>
                          <DinaMessage id="resizeImages" />
                        </strong>
                        <Tooltip
                          id="exportResizeImagesTooltip"
                          className="ms-2"
                        />
                      </label>
                      <Select
                        name="resizePercentage"
                        options={RESIZE_OPTIONS}
                        onChange={(selection) => {
                          if (selection) {
                            setResizePercentage(selection.value);
                          }
                        }}
                        isLoading={loadingObjectMetadatas}
                        isDisabled={loading || !resizeAvailable}
                        placeholder={imageOptionsPlaceholder}
                        classNamePrefix="react-select"
                        value={
                          imageOptionsAvailable
                            ? RESIZE_OPTIONS.find(
                                (option) =>
                                  option.value === exportResizePercentage
                              )
                            : null
                        }
                      />
                      {imageOptionsAvailable && !resizeAvailable && (
                        <div className="form-text">
                          <DinaMessage id="resizeImagesJpegOnlyTooltip" />
                        </div>
                      )}
                    </div>
                  </div>
                </FieldSet>
              )}

              {exportType === "TABULAR_DATA" && (
                <FieldSet legend={<DinaMessage id="export_columnsToExport" />}>
                  <ColumnSelectorMemo
                    exportMode={true}
                    displayedColumns={columnsToExport as any}
                    setDisplayedColumns={setColumnsToExport as any}
                    overrideDisplayedColumns={columnPathsToExport}
                    setOverrideDisplayedColumns={setColumnPathsToExport}
                    indexMapping={indexMap}
                    uniqueName={uniqueName}
                    dynamicFieldsMappingConfig={dynamicFieldMapping}
                    disabled={loading}
                    nonExportableColumns={nonExportableColumns}
                  />
                </FieldSet>
              )}
            </div>
            {summary}
          </div>
        </DinaForm>
      </PageLayout>
    </>
  );
}
