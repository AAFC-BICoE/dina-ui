import { withRouter } from "next/router";
import PageLayout from "../../components/page/PageLayout";
import {
  ColumnSelectorMemo,
  DinaForm,
  FieldWrapper,
  SubmitButton,
  useApiClient
} from "common-ui";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Alert, Card, Spinner } from "react-bootstrap";
import Select from "react-select";
import { useState } from "react";
import {
  DynamicFieldsMappingConfig,
  TableColumn
} from "common-ui/lib/list-page/types";
import { dynamicFieldMappingForMaterialSample } from "../collection/material-sample/list";
import { useIndexMapping } from "common-ui/lib/list-page/useIndexMapping";
import { KitsuResource } from "kitsu";
import { WorkbookGeneration } from "packages/dina-ui/types/dina-export-api/resources/WorkbookGeneration";
import Link from "next/link";

export interface EntityConfiguration {
  name: string;
  indexName: string;
  uniqueName: string;
  dynamicConfig: DynamicFieldsMappingConfig;
}

// Entities that we support to generate templates
const ENTITY_TYPES: EntityConfiguration[] = [
  {
    name: "material-sample",
    indexName: "dina_material_sample_index",
    uniqueName: "material-sample-template-generator",
    dynamicConfig: dynamicFieldMappingForMaterialSample
  }
];

export function WorkbookTemplateGenerator<TData extends KitsuResource>() {
  const { formatMessage } = useDinaIntl();
  const { apiClient } = useApiClient();

  // Loading state
  const [loading, setLoading] = useState<boolean>(false);

  // Generator errors
  const [errorMessage, setErrorMessage] = useState<string>();

  // Entity to be generated (e.g. material-sample)
  const [type, setType] = useState<EntityConfiguration>(ENTITY_TYPES[0]);

  // Columns selected for the generator
  const [columnsToGenerate, setColumnsToGenerate] = useState<
    TableColumn<TData>[]
  >([]);

  const entityTypes = ENTITY_TYPES.map((entityType) => ({
    label: formatMessage(entityType.name as any),
    value: entityType.name,
    instance: entityType
  }));
  const selectedType = entityTypes.find((item) => item.value === type.name);

  const { indexMap } = useIndexMapping({
    indexName: type.indexName,
    dynamicFieldMapping: type.dynamicConfig
  });

  async function generateTemplate() {
    setLoading(true);
    setErrorMessage(undefined);

    const generateTemplateArg: WorkbookGeneration = {
      columns: columnsToGenerate.map((col) => col.id),
      aliases: columnsToGenerate.map((col) =>
        col?.exportHeader ? col.exportHeader : col.id
      )
    } as WorkbookGeneration;

    try {
      const workbookGenerationPostResponse = await apiClient.axios.post(
        "objectstore-api/workbook/generation",
        generateTemplateArg
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

  return (
    <DinaForm initialValues={{}}>
      <PageLayout
        titleId="workbookGenerateTemplateTitle"
        buttonBarContent={
          <>
            <div className="col-md-6 col-sm-12 mt-2">
              <Link href={"/workbook/upload"}>
                <a className={`back-button my-auto`}>
                  <DinaMessage id={"backToUploadWorkbook"} />
                </a>
              </Link>
            </div>
            <div className="col-md-6 col-sm-12 d-flex">
              <SubmitButton
                className="ms-auto"
                buttonProps={() => ({
                  style: { width: "12rem" },
                  disabled: loading || columnsToGenerate.length === 0,
                  onClick: () => generateTemplate()
                })}
              >
                {loading ? (
                  LoadingSpinner
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
              <FieldWrapper name="type" className="flex-grow-1">
                <Select
                  isDisabled={entityTypes.length === 1}
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
          <DinaMessage id="templateGenerator_columnsToGenerate" />
        </h4>
        <Card>
          <Card.Body>
            <ColumnSelectorMemo
              exportMode={true}
              displayedColumns={columnsToGenerate as any}
              setDisplayedColumns={setColumnsToGenerate as any}
              indexMapping={indexMap}
              uniqueName={type.uniqueName}
              dynamicFieldsMappingConfig={type.dynamicConfig}
              disabled={loading}
            />
          </Card.Body>
        </Card>
      </PageLayout>
    </DinaForm>
  );
}

export default withRouter(WorkbookTemplateGenerator);
