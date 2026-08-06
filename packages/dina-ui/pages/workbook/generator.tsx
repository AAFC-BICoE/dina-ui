import { withRouter } from "next/router";
import PageLayout from "../../components/page/PageLayout";
import {
  GeneratorSelectorMemo,
  DinaForm,
  FieldWrapper,
  SubmitButton,
  useApiClient,
  GeneratorColumn,
  useAccount,
  ListPageLayout,
  dateCell,
  LoadingSpinner,
  ColumnDefinition,
  SimpleSearchFilterBuilder,
  IFileWithMeta
} from "common-ui";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Alert, Button, Card, Form } from "react-bootstrap";
import Select from "react-select";
import { useEffect, useMemo, useState } from "react";
import { DynamicFieldsMappingConfig } from "common-ui/lib/list-page/types";
import { dynamicFieldMappingForMaterialSample } from "../collection/material-sample/list";
import Link from "next/link";
import FieldMappingConfig from "../../components/workbook/utils/FieldMappingConfig";
import {
  FieldOptionType,
  generateWorkbookFieldOptions,
  getFlattenedConfig,
  getGeneratorColumnFromFieldName
} from "../../components/workbook/utils/workbookMappingUtils";
import InputGroup from "react-bootstrap/InputGroup";
import { Metadata } from "packages/dina-ui/types/objectstore-api";
import { handleDownloadLink } from "../../components/object-store/object-store-utils";
import { downloadBlobFile } from "common-ui";
import _ from "lodash";
import { dynamicFieldMappingForMetadata } from "../object-store/object/list";
import { WorkbookUpload } from "../../components/workbook/WorkbookUpload";
import { useWorkbookConversion } from "@dina-ui/components";
import { FaCheck } from "react-icons/fa6";
import { FaExclamationCircle } from "react-icons/fa";

export interface EntityConfiguration {
  name: string;
  indexName: string;
  uniqueName: string;
  dynamicConfig: DynamicFieldsMappingConfig;
  requiredFields?: string[];
}

// Entities that we support to generate templates
const ENTITY_TYPES: EntityConfiguration[] = [
  {
    name: "material-sample",
    indexName: "dina_material_sample_index",
    uniqueName: "material-sample-template-generator",
    dynamicConfig: {
      fields: dynamicFieldMappingForMaterialSample.fields,
      relationshipFields: [
        ...dynamicFieldMappingForMaterialSample.relationshipFields,
        {
          apiEndpoint: "collection-api/vocabulary2/taxonomicRank",
          label: "scientificNameDetails",
          path: "included.attributes.determination.scientificNameDetails",
          referencedBy: "organism.determination",
          referencedType: "organism",
          type: "classification",
          component: "ORGANISM"
        }
      ]
    }
  },
  {
    name: "metadata",
    indexName: "dina_object_store_index",
    uniqueName: "metadata-template-generator",
    requiredFields: ["originalFilename"],
    dynamicConfig: dynamicFieldMappingForMetadata
  }
];

export function WorkbookTemplateGenerator() {
  const { formatMessage } = useDinaIntl();
  const { apiClient } = useApiClient();

  const { convertWorkbookFile, loading, setLoading } = useWorkbookConversion();

  // Generator errors
  const [errorMessage, setErrorMessage] = useState<string>();

  // Filename
  const [fileName, setFileName] = useState<string>("");

  // Entity to be generated (e.g. material-sample)
  const [type, setType] = useState<EntityConfiguration>(ENTITY_TYPES[0]);

  // Columns selected for the generator
  const [columnsToGenerate, setColumnsToGenerate] = useState<GeneratorColumn[]>(
    []
  );

  // Whether the template has been loaded from an existing file
  const [templateLoaded, setTemplateLoaded] = useState<boolean>(false);

  // Columns from the uploaded template that could not be mapped to existing fields
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([]);

  // Whether the uploaded template is invalid (e.g., missing required columns)
  const [invalidTemplate, setInvalidTemplate] = useState<boolean>(false);

  const { groupNames } = useAccount();

  const entityTypes = ENTITY_TYPES.map((entityType) => ({
    label: formatMessage(entityType.name as any),
    value: entityType.name,
    instance: entityType
  }));
  const selectedType = entityTypes.find((item) => item.value === type.name);

  const flattenedConfig = useMemo(() => {
    return getFlattenedConfig(FieldMappingConfig, type.name);
  }, [type.name]);

  const newFieldOptions = useMemo(() => {
    return generateWorkbookFieldOptions(flattenedConfig, formatMessage);
  }, [flattenedConfig]);

  // Automatically add required fields when type changes
  useEffect(() => {
    if (type.requiredFields && type.requiredFields.length > 0) {
      const requiredColumns: GeneratorColumn[] = type.requiredFields
        .map((fieldName) =>
          getGeneratorColumnFromFieldName(
            fieldName,
            newFieldOptions,
            formatMessage,
            "",
            true
          )
        )
        .filter((column): column is GeneratorColumn => column !== undefined);

      setColumnsToGenerate(requiredColumns);
    } else {
      setColumnsToGenerate([]);
    }
  }, [type, newFieldOptions]);

  async function generateTemplate() {
    setLoading(true);
    setErrorMessage(undefined);

    // Retrieve the filename.
    const safeFileName = fileName === "" ? "template" : fileName;

    // Ensure the filename provided is supported by Windows.
    const validFilenameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validFilenameRegex.test(safeFileName)) {
      setErrorMessage(
        "Please enter a valid filename. Only letters, numbers, spaces, hyphens, and underscores are allowed."
      );
      setLoading(false);
      return;
    }

    const generateTemplateArg: any = {
      data: {
        type: "workbook-generation",
        attributes: {
          columns: columnsToGenerate.map((col) => {
            // Use managed attribute key instead
            if ((col as any)?.managedAttribute?.name) {
              return (col as any)?.managedAttribute?.name;
            }

            // Special logic for scientificNameDetails.
            if (
              col.columnValue.startsWith(
                "organism.determination.scientificNameDetails."
              )
            ) {
              return col.columnLabel;
            }

            return col.columnValue;
          }),
          aliases: columnsToGenerate.map<string>((col) =>
            col?.columnAlias ? col.columnAlias : col.columnLabel
          )
        }
      }
    };

    try {
      const workbookGenerationPostResponse = await apiClient.axios.post(
        "objectstore-api/workbook/generation",
        generateTemplateArg,
        {
          headers: {
            "Content-Type": "application/vnd.api+json"
          },
          responseType: "blob"
        }
      );

      // Download the data
      downloadBlobFile(
        workbookGenerationPostResponse?.data,
        safeFileName + ".xlsx"
      );
    } catch (error) {
      // Log the error for debugging
      console.error("Error generating workbook template:", error);

      // Extract a user-friendly error message:
      let userFriendlyErrorMessage =
        "An error occurred while generating the workbook template. Please try again later.";
      if (error.response) {
        // If a response object is available, extract the status code and message
        userFriendlyErrorMessage = `Error ${error.response.status}: ${
          error.response.data.message || "Unknown error"
        }`;
      }

      // Set the user-friendly error message for display
      setErrorMessage(userFriendlyErrorMessage);
    }

    setLoading(false);
  }

  async function loadExistingTemplate(files: IFileWithMeta[]) {
    setLoading(true);
    setErrorMessage(undefined);
    setInvalidTemplate(false);

    const responseData = await convertWorkbookFile(files);

    if (responseData && templateLoaded === false) {
      setTemplateLoaded(true);
      setUnmappedColumns([]);

      // Load the columns from the uploaded template
      const sheets = Object.values(responseData) as any[];
      const sheet = sheets.length > 0 ? sheets[0] : undefined;
      const originalColumns: string[] = sheet?.originalColumns ?? [];
      const columnAliases: string[] = sheet?.columnAliases ?? [];

      // Check if it's a valid template.
      if (originalColumns.length === 0) {
        setInvalidTemplate(true);
        setLoading(false);
        return;
      }

      // Set the filename
      const uploadedFileName = files[0]?.file?.name ?? "";
      const safeFileName = uploadedFileName.replace(/\.[^/.]+$/, "");
      setFileName(safeFileName);

      // Map originalColumns to GeneratorColumn entries, preferring existing field options when possible
      const loadedColumnsWithUndefined = originalColumns.map(
        (colName: string, idx: number) => {
          const alias = columnAliases[idx];

          return getGeneratorColumnFromFieldName(
            colName,
            newFieldOptions,
            formatMessage,
            alias ?? "",
            false
          );
        }
      );

      // Filter out any undefined columns and set the loaded columns to state.
      const loadedColumns: GeneratorColumn[] =
        loadedColumnsWithUndefined.filter(
          (c): c is GeneratorColumn => c !== undefined && c !== null
        );

      // Determine which original columns were not mapped
      const unmapped = originalColumns.filter(
        (_col, idx) => loadedColumnsWithUndefined[idx] === undefined
      );
      setUnmappedColumns(unmapped);

      setColumnsToGenerate(loadedColumns);
    }

    setLoading(false);
  }

  const TABLE_COLUMNS: ColumnDefinition<Metadata>[] = [
    "originalFilename",
    "createdBy",
    dateCell("createdOn"),
    {
      id: "download",
      cell: ({ row: { original } }) => {
        return (
          <Button
            disabled={loading}
            className="btn btn-primary bulk-edit-button"
            onClick={async () => {
              setLoading(true);
              await handleDownloadLink(
                `/objectstore-api/file/${original.bucket}/${original.fileIdentifier}`,
                apiClient,
                setLoading
              );
              setLoading(false);
            }}
          >
            {loading ? (
              <LoadingSpinner loading={loading} />
            ) : (
              <DinaMessage id="downloadTemplate" />
            )}
          </Button>
        );
      },
      header: ""
    }
  ];

  return (
    <DinaForm initialValues={{}}>
      <PageLayout
        titleId="workbookGenerateTemplateTitle"
        buttonBarContent={
          <>
            <div className="col-md-6 col-sm-12 mt-2">
              <Link href={"/workbook/upload"} className={`back-button my-auto`}>
                <DinaMessage id={"backToUploadWorkbook"} />
              </Link>
            </div>
            <div className="col-md-6 col-sm-12 d-flex">
              <SubmitButton
                className="ms-auto"
                buttonProps={() => ({
                  style: { width: "14rem" },
                  disabled: loading || columnsToGenerate.length === 0,
                  onClick: () => generateTemplate()
                })}
              >
                {loading ? (
                  <LoadingSpinner loading={true} />
                ) : (
                  <DinaMessage id="generateButtonText" />
                )}
              </SubmitButton>
            </div>
          </>
        }
      >
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <h4 className="mt-4">
          <DinaMessage id="settingLabel" />
        </h4>
        <Card>
          <Card.Body>
            <div className="list-inline d-flex flex-row gap-4 pt-2">
              <div className="flex-grow-1">
                <strong>
                  <DinaMessage id="templateName" />
                </strong>
                <InputGroup className="mt-2">
                  <Form.Control
                    name="name"
                    disabled={loading}
                    className="flex-grow-1 form-control"
                    onChange={(e) => {
                      setFileName(
                        (e.target as HTMLTextAreaElement | HTMLInputElement)
                          .value ?? ""
                      );
                    }}
                    value={fileName}
                    placeholder="template"
                    aria-describedby="extension"
                  />
                  <InputGroup.Text id="extension">.xlsx</InputGroup.Text>
                </InputGroup>
              </div>

              <FieldWrapper name="type" className="flex-grow-1">
                <Select
                  value={selectedType}
                  onChange={(entityType) =>
                    setType(
                      ENTITY_TYPES.find(
                        (searchType) => searchType.name === entityType?.value
                      ) ?? ENTITY_TYPES[0]
                    )
                  }
                  options={entityTypes}
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                  }}
                />
              </FieldWrapper>
            </div>
          </Card.Body>
        </Card>

        <h4 className="mt-4">
          <DinaMessage id="loadExistingTemplate" />
        </h4>
        <Card>
          <Card.Body>
            {templateLoaded && (
              <>
                {invalidTemplate ? (
                  <div
                    className="alert alert-danger d-flex align-items-center gap-2 mb-2"
                    role="alert"
                  >
                    <FaExclamationCircle className="flex-shrink-0" />
                    <span>
                      <DinaMessage id="invalidTemplate" />
                    </span>
                  </div>
                ) : (
                  <div
                    className="alert alert-success d-flex align-items-center gap-2 mb-2"
                    role="alert"
                  >
                    <FaCheck className="flex-shrink-0" />
                    <span>
                      <DinaMessage id="templateLoadedSuccessfully" />
                    </span>
                  </div>
                )}

                {unmappedColumns.length > 0 && (
                  <div
                    className="alert alert-warning d-flex align-items-center gap-2 mb-2"
                    role="alert"
                  >
                    <FaExclamationCircle className="flex-shrink-0" />
                    <span>
                      <DinaMessage
                        id="templateColumnsUnmapped"
                        values={{ columns: unmappedColumns.join(", ") }}
                      />
                    </span>
                  </div>
                )}
              </>
            )}
            <WorkbookUpload
              submitData={loadExistingTemplate}
              autoUpload={true}
              onClear={() => {
                setTemplateLoaded(false);
                setUnmappedColumns([]);
                setInvalidTemplate(false);
              }}
            />
          </Card.Body>
        </Card>

        <h4 className="mt-4">
          <DinaMessage id="templateGenerator_columnsToGenerate" />
        </h4>
        <Card>
          <Card.Body>
            <GeneratorSelectorMemo
              generatorFields={newFieldOptions as FieldOptionType[]}
              displayedColumns={columnsToGenerate as any}
              setDisplayedColumns={setColumnsToGenerate as any}
              dynamicFieldsMappingConfig={type.dynamicConfig}
              disabled={loading}
            />
          </Card.Body>
        </Card>

        <h4 className="mt-4">
          <DinaMessage id="existingTemplates" />
        </h4>
        <Card>
          <Card.Body>
            <ListPageLayout
              id="data-export-list"
              queryTableProps={() => ({
                columns: TABLE_COLUMNS,
                path: "objectstore-api/metadata",
                filter: SimpleSearchFilterBuilder.create()
                  .where("acSubtype.acSubtype", "EQ", "IMPORT TEMPLATE")
                  .whereIn("bucket", groupNames)
                  .build()
              })}
            />
          </Card.Body>
        </Card>
      </PageLayout>
    </DinaForm>
  );
}

export default withRouter(WorkbookTemplateGenerator);
