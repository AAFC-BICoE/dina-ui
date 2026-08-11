import { useLocalStorage } from "@rehooks/local-storage";
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
import {
  Button,
  ButtonGroup,
  Card,
  Spinner,
  ToggleButton
} from "react-bootstrap";
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

const NON_EXPORTABLE_COLUMNS_MAP: { [key: string]: string[] } = {
  ["dina_material_sample_index"]: MATERIAL_SAMPLE_NON_EXPORTABLE_COLUMNS,
  ["dina_object_store_index"]: OBJECT_STORE_NON_EXPORTABLE_COLUMNS
};

export default function ExportPage<TData extends KitsuResource>() {
  const { formatNumber } = useIntl();
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

  // Only available through the object export (all objects need to be JPEG), the scale to apply to the export.
  const [resizePercentage, setResizePercentage] = useState<number>(100);

  // Tracks if all selected objects in OBJECT_ARCHIVE mode are JPEG.
  const [allObjectsAreJpeg, setAllObjectsAreJpeg] = useState<boolean>(false);

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

  // Check if all selected objects are JPEGs when switching to OBJECT_ARCHIVE export
  useEffect(() => {
    async function checkJpegEligibility() {
      if (
        exportType === "OBJECT_ARCHIVE" &&
        localStorageExportObjectIds.length > 0
      ) {
        try {
          const paths = localStorageExportObjectIds.map(
            (id) => `metadata/${id}`
          );
          const metadatas: PersistedResource<Metadata>[] = await bulkGet(
            paths,
            {
              apiBaseUrl: "/objectstore-api"
            }
          );

          const isAllJpeg = metadatas.every(
            (meta) =>
              meta.dcFormat === "image/jpeg" ||
              meta.fileExtension?.toLowerCase() === ".jpg" ||
              meta.fileExtension?.toLowerCase() === ".jpeg"
          );

          setAllObjectsAreJpeg(isAllJpeg);
        } catch {
          setAllObjectsAreJpeg(false);
        }
      } else {
        setAllObjectsAreJpeg(false);
      }
    }

    checkJpegEligibility();
  }, [exportType, localStorageExportObjectIds]);

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
    {
      setLoading(true);

      // Clear error message.
      setDataExportError(undefined);

      const paths = localStorageExportObjectIds.map(
        (id) => `metadata/${id}?include=derivatives`
      );
      const metadatas: PersistedResource<Metadata>[] = await bulkGet(paths, {
        apiBaseUrl: "/objectstore-api"
      });

      const fileIdentifiers = metadatas.map((metadata) => {
        // If the metadata is for an image and has derivatives, return the large image derivative fileIdentifier if present
        if (metadata.dcType === "IMAGE" && metadata.derivatives) {
          const largeImageDerivative = metadata?.derivatives?.find?.(
            (derivative) => derivative.derivativeType === "LARGE_IMAGE"
          );
          if (largeImageDerivative) {
            return largeImageDerivative.fileIdentifier;
          }
        }
        // Otherwise, return the original fileIdentifier
        return metadata.fileIdentifier;
      });

      const filenameAliases = {};

      if (selectedFilenameAliasField) {
        metadatas.forEach((metadata) => {
          const filenameAlias: string =
            selectedFilenameAliasField.label === "managedAttributes" &&
            dynamicFieldValue
              ? get(
                  metadata,
                  JSON.parse(dynamicFieldValue).selectedManagedAttributeConfig
                    .label
                )
              : get(metadata, selectedFilenameAliasField.label);
          if (metadata?.derivatives?.find) {
            // If image has derivative, use large image derivative fileIdentifier
            const largeImageDerivative = metadata.derivatives.find(
              (derivative) => {
                if (derivative.derivativeType === "LARGE_IMAGE") {
                  return true;
                }
              }
            );
            if (largeImageDerivative) {
              filenameAliases[largeImageDerivative.fileIdentifier] =
                filenameAlias;
            }
          }

          if (metadata.fileIdentifier)
            // Otherwise, use original fileIdentifier
            filenameAliases[metadata.fileIdentifier] = filenameAlias;
        });
      }

      const hasFilenameAliases = Object.keys(filenameAliases).length > 0;

      const objectExportSaveArg = {
        resource: {
          type: "object-export",
          fileIdentifiers,
          name: formik?.values?.name,
          ...(hasFilenameAliases ? { filenameAliases } : {}),
          ...(allObjectsAreJpeg && resizePercentage < 100
            ? {
                exportFunction: {
                  functionDef: "IMG_RESIZE",
                  params: {
                    factor: (resizePercentage / 100).toString()
                  }
                }
              }
            : {})
        },
        type: "object-export"
      };

      try {
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

  const resizeControl = (
    <div>
      <div className="mb-2">
        <strong>
          <DinaMessage id="resizeImages" />
        </strong>
      </div>
      <Select
        className="mt-2 mb-3"
        name="resizePercentage"
        options={RESIZE_OPTIONS}
        onChange={(selection) => {
          if (selection) {
            setResizePercentage(selection.value);
          }
        }}
        isDisabled={loading || !allObjectsAreJpeg}
        value={RESIZE_OPTIONS.find(
          (option) => option.value === resizePercentage
        )}
      />
    </div>
  );

  const disableObjectExportButton =
    localStorageExportObjectIds.length < 1 ||
    totalRecords > MAX_OBJECT_EXPORT_TOTAL;

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

          <CommonMessage
            id="tableTotalCount"
            values={{ totalCount: formatNumber(totalRecords ?? 0) }}
          />
          <div className="col-md-12">
            <h4 className="mt-3">
              <DinaMessage id="settingLabel" />
            </h4>
            <Card>
              <Card.Body>
                <div className="row">
                  <div className="col-md-4">
                    <TextField
                      name={"name"}
                      customName="exportName"
                      disabled={loading}
                    />
                    {uniqueName === "object-store-list" && (
                      <>
                        <strong>
                          <DinaMessage id="savedExport_exportType" />
                        </strong>
                        <br />
                        <ButtonGroup className="mt-1">
                          <ToggleButton
                            id="export-data"
                            value={"data"}
                            type={"radio"}
                            checked={exportType === "TABULAR_DATA"}
                            onClick={() => {
                              setExportType("TABULAR_DATA");
                            }}
                            variant={
                              exportType === "TABULAR_DATA"
                                ? "primary"
                                : "outline-primary"
                            }
                            disabled={loading}
                          >
                            <DinaMessage id="dataLabel" />
                          </ToggleButton>
                          <ToggleButton
                            id="export-object"
                            value={"object"}
                            type={"radio"}
                            checked={exportType === "OBJECT_ARCHIVE"}
                            onClick={() => {
                              setExportType("OBJECT_ARCHIVE");
                            }}
                            variant={
                              exportType === "OBJECT_ARCHIVE"
                                ? "primary"
                                : "outline-primary"
                            }
                            disabled={loading}
                          >
                            <DinaMessage id="objectsLabel" />
                          </ToggleButton>
                        </ButtonGroup>
                      </>
                    )}
                  </div>
                  {exportType === "TABULAR_DATA" && (
                    <>
                      <div className="col-md-4">
                        <strong>
                          <DinaMessage id="separator" />
                        </strong>
                        <Select<{ value: ColumnSeparator; label: string }>
                          className="mt-2 mb-3"
                          name="separator"
                          options={SEPARATOR_OPTIONS}
                          onChange={(selection) => {
                            if (selection) {
                              setSelectedSeparator(selection);
                            }
                          }}
                          isLoading={loadingSavedExports}
                          isDisabled={loading}
                          defaultValue={selectedSeparator}
                        />
                      </div>
                      <div className="col-md-4">
                        <strong>
                          <DinaMessage id="savedExport_exportDropdown" />
                        </strong>
                        <Select<SavedExportOption>
                          className="mt-2 mb-3"
                          name="savedExportOption"
                          options={allSavedExports.map((option) => ({
                            value: option.name,
                            label: option.name,
                            resource: option
                          }))}
                          onChange={(selection) => {
                            if (selection && selection.resource) {
                              setSelectedSavedExport(selection.resource);
                            }
                          }}
                          isLoading={loadingSavedExports}
                          isDisabled={loading}
                          value={
                            allSavedExports
                              ?.map((option) => ({
                                value: option.name,
                                label: option.name,
                                resource: option
                              }))
                              ?.find(
                                (option) =>
                                  option.value === selectedSavedExport?.name
                              ) ?? null
                          }
                        />
                      </div>
                      {selectedSavedExport && (
                        <div className="d-flex">
                          <div className="me-auto">
                            <Button
                              style={{ marginTop: "30px" }}
                              variant="danger"
                              onClick={deleteSavedExport}
                              disabled={loadingDelete || loading}
                            >
                              {loadingDelete ? LoadingSpinner : <FaTrash />}
                            </Button>
                            {changesMade && (
                              <Button
                                style={{
                                  marginTop: "30px",
                                  marginLeft: "10px"
                                }}
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
                            )}
                          </div>
                          <div
                            className="col-md-4 p"
                            style={{ paddingLeft: "15px" }}
                          >
                            <strong>
                              <DinaMessage id="visibility" />
                            </strong>
                            <Select<{
                              label: React.JSX.Element;
                              value: {
                                restrictToCreatedBy: boolean;
                                publiclyReleasable: boolean;
                              };
                            }>
                              className="mt-2 mb-3"
                              name="visibility"
                              options={VISIBILITY_OPTIONS}
                              onChange={(selected) => {
                                setRestrictToCreatedBy(
                                  selected!.value.restrictToCreatedBy
                                );
                                setPubliclyReleaseable(
                                  selected!.value.publiclyReleasable
                                );
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
                        </div>
                      )}
                    </>
                  )}
                  {exportType === "OBJECT_ARCHIVE" && (
                    <>
                      <div className="col-md-4">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="mb-2">
                              <strong>
                                <DinaMessage id="fileNameAliasField" />
                              </strong>
                            </div>
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
                          </div>
                          {displayManagedAttributes && (
                            <div
                              className="col-md-12"
                              style={{ marginTop: "22px" }}
                            >
                              <QueryRowManagedAttributeSearch
                                indexMap={indexMap}
                                managedAttributeConfig={
                                  selectedFilenameAliasField
                                }
                                isInColumnSelector={true}
                                setValue={setDynamicFieldValue}
                                value={dynamicFieldValue}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        {!allObjectsAreJpeg ? (
                          <Tooltip
                            id="resizeImagesJpegOnlyTooltip"
                            disableSpanMargin={true}
                            visibleElement={resizeControl}
                          />
                        ) : (
                          resizeControl
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Card.Body>
              <Card.Footer className="d-flex">
                <div className="me-auto" ref={submitButtonRef}>
                  <SubmitButton
                    buttonProps={(formik) => ({
                      style: { width: "8rem" },
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
                    ) : (
                      <DinaMessage id="exportButtonText" />
                    )}
                  </SubmitButton>
                  <ExportPopup
                    target={submitButtonRef.current}
                    show={exportRequestSubmitted}
                    onClose={() => setExportRequestSubmitted(false)}
                  />
                  {uniqueName === "object-store-list" &&
                    disableObjectExportButton && (
                      <Tooltip id="exportObjectsMaxLimitTooltip" />
                    )}
                </div>
                {exportType === "TABULAR_DATA" && (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handleShowCreateSavedExportModal}
                    disabled={loadingSavedExports || loading}
                  >
                    <DinaMessage id="savedExport_createTitle" />
                  </button>
                )}
              </Card.Footer>
            </Card>

            {exportType === "TABULAR_DATA" && (
              <>
                <h4 className="mt-4">
                  <DinaMessage id="export_columnsToExport" />
                </h4>
                <Card>
                  <Card.Body>
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
                  </Card.Body>
                </Card>
              </>
            )}
          </div>
        </DinaForm>
      </PageLayout>
    </>
  );
}
