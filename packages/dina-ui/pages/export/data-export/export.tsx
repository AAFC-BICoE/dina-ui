import { useLocalStorage } from "@rehooks/local-storage";
import { KitsuResource, PersistedResource } from "kitsu";
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
} from "packages/common-ui/lib";
import {
  DynamicFieldsMappingConfig,
  ESIndexMapping
} from "packages/common-ui/lib/list-page/types";
import { useIndexMapping } from "packages/common-ui/lib/list-page/useIndexMapping";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import {
  ColumnSeparator,
  DataExport,
  DataExportTemplate,
  ExportType
} from "packages/dina-ui/types/dina-export-api";
import { Metadata, ObjectExport } from "packages/dina-ui/types/objectstore-api";
import { ReactNode, useState } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  Spinner,
  ToggleButton
} from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import { useIntl } from "react-intl";
import Select from "react-select";
import { useSessionStorage } from "usehooks-ts";
import useSavedExports, { VISIBILITY_OPTIONS } from "./useSavedExports";
import { QueryFieldSelector } from "packages/common-ui/lib/list-page/query-builder/query-builder-core-components/QueryFieldSelector";
import QueryRowManagedAttributeSearch from "packages/common-ui/lib/list-page/query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";
import _ from "lodash";
import { MATERIAL_SAMPLE_NON_EXPORTABLE_COLUMNS } from "../../collection/material-sample/list";
import { OBJECT_STORE_NON_EXPORTABLE_COLUMNS } from "../../object-store/object/list";
import {
  getExport,
  MAX_MATERIAL_SAMPLES_FOR_MOLECULAR_ANALYSIS_EXPORT,
  MAX_OBJECT_EXPORT_TOTAL
} from "packages/common-ui/lib/export/exportUtils";
import {
  convertColumnsToAliases,
  convertColumnsToPaths,
  getColumnFunctions
} from "packages/common-ui/lib/column-selector/ColumnSelectorUtils";

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

const NON_EXPORTABLE_COLUMNS_MAP: { [key: string]: string[] } = {
  ["dina_material_sample_index"]: MATERIAL_SAMPLE_NON_EXPORTABLE_COLUMNS,
  ["dina_object_store_index"]: OBJECT_STORE_NON_EXPORTABLE_COLUMNS
};

export default function ExportPage<TData extends KitsuResource>() {
  const { formatNumber } = useIntl();
  const { bulkGet, apiClient, save } = useApiClient();
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
  } = useSavedExports<TData>({ exportType, selectedSeparator });

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
    const filteredColumns = columnsToExport.filter(
      (column) =>
        !nonExportableColumns.some((prefix) =>
          (column?.id ?? "").startsWith(prefix)
        )
    );

    // Make query to data-export
    const dataExportSaveArg: SaveArgs<DataExport> = {
      resource: {
        type: "data-export",
        source: indexName,
        query: queryString,
        columns: convertColumnsToPaths(filteredColumns),
        columnAliases: convertColumnsToAliases(filteredColumns),
        functions:
          Object.keys(columnFunctions ?? {}).length === 0
            ? undefined
            : columnFunctions,
        name: formik?.values?.name,
        exportOptions: { columnSeparator: selectedSeparator?.value }
      },
      type: "data-export"
    };

    const dataExportPostResponse = await save<DataExport>([dataExportSaveArg], {
      apiBaseUrl: "/dina-export-api"
    });

    await getExport(
      dataExportPostResponse,
      setLoading,
      setDataExportError,
      apiClient,
      formik
    );
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
          const largeImageDerivative = metadata.derivatives.find(
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
              ? _.get(
                  metadata,
                  JSON.parse(dynamicFieldValue).selectedManagedAttributeConfig
                    .label
                )
              : _.get(metadata, selectedFilenameAliasField.label);
          if (metadata.derivatives) {
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

      const objectExportSaveArg = {
        resource: {
          type: "object-export",
          fileIdentifiers,
          name: formik?.values?.name,
          filenameAliases: filenameAliases
        },
        type: "object-export"
      };

      try {
        const objectExportResponse = await save<ObjectExport>(
          [objectExportSaveArg],
          {
            apiBaseUrl: "/objectstore-api"
          }
        );
        await getExport(
          objectExportResponse,
          setLoading,
          setDataExportError,
          apiClient,
          formik
        );
      } catch (e) {
        setDataExportError(
          <div className="alert alert-danger">{e?.message ?? e.toString()}</div>
        );
      }

      setLoading(false);
    }
  }

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
                  <DinaMessage id="molecularAnalysisExport" />
                </Link>
              )}
              <Link
                href={`/export/data-export/list?entityLink=${entityLink}`}
                className="btn btn-primary ms-2"
              >
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
                              label: JSX.Element;
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
                      {selectedFilenameAliasField?.dynamicField?.type ===
                        "managedAttribute" && (
                        <div className="col-md-4" style={{ marginTop: "22px" }}>
                          <QueryRowManagedAttributeSearch
                            indexMap={indexMap}
                            managedAttributeConfig={selectedFilenameAliasField}
                            isInColumnSelector={true}
                            setValue={setDynamicFieldValue}
                            value={dynamicFieldValue}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card.Body>
              <Card.Footer className="d-flex">
                <div className="me-auto">
                  <SubmitButton
                    buttonProps={(formik) => ({
                      style: { width: "8rem" },
                      disabled: loading,
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
