import Kitsu, { GetParams, KitsuResource } from "kitsu";
import _ from "lodash";
import { FaCheckSquare, FaRegSquare } from "react-icons/fa";
import { FieldHeader, dateCell } from "..";
import { VocabularyFieldHeader } from "../../../../packages/dina-ui/components";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { FieldExtensionSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderFieldExtensionSearch";
import { IdentifierSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderIdentifierSearch";
import { ManagedAttributeSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";
import { RelationshipPresenceSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderRelationshipPresenceSearch";
import {
  DynamicField,
  DynamicFieldsMappingConfig,
  DynamicFieldType,
  ESIndexMapping,
  RelationshipDynamicField,
  TableColumn
} from "../list-page/types";
import { ClassificationSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderClassificationSearch";
import { VocabularyElement } from "packages/dina-ui/types/collection-api";
import {
  getImageLinkColumn,
  ImageLinkStates
} from "../list-page/query-builder/query-builder-value-types/QueryBuilderImageLink";
import { FunctionDef } from "../../../dina-ui/types/dina-export-api/resources/DataExport";

export function convertColumnsToAliases(columns): string[] {
  if (!columns) {
    return [];
  }
  return columns.map((column) => column?.exportHeader ?? "");
}

export function convertColumnsToPaths(columns): string[] {
  if (!columns) {
    return [];
  }
  return columns.map((column) =>
    column.columnSelectorString?.startsWith("columnFunction/")
      ? column.columnSelectorString?.split("/")[1] // Get functionId
      : column.id ?? ""
  );
}

export function getColumnFunctions<TData extends KitsuResource>(
  columnsToExport: TableColumn<TData>[]
) {
  return columnsToExport
    .filter((c) => c.columnSelectorString?.startsWith("columnFunction/"))
    .reduce((prev, curr) => {
      const columnParts = curr.columnSelectorString?.split("/");
      if (columnParts) {
        const functionName = columnParts[2];
        const functionParams = columnParts[3]?.split("+");
        const params =
          functionName === "CONVERT_COORDINATES_DD"
            ? ["collectingEvent.eventGeom"]
            : functionParams;
        return {
          ...prev,
          [columnParts[1]]: {
            functionName: columnParts[2],
            params: params
          }
        };
      }
    }, {});
}

export interface GenerateColumnPathProps {
  /** Index mapping for the column to generate the column path. */
  indexMapping: ESIndexMapping;

  /** Dynamic field value passed from the query builder managed attribute/field extension components */
  dynamicFieldValue?: string;
}

export function generateColumnPath({
  indexMapping,
  dynamicFieldValue
}: GenerateColumnPathProps) {
  // Handle the path for dynamic fields.
  if (indexMapping.dynamicField && dynamicFieldValue) {
    // Relationship name will be included with the type of the dynamic field, if it's entity
    // level then it's just not included. This helps to determine exactly what relationship
    // this needs to connect to.
    const dynamicFieldTypeWithRelationship =
      indexMapping.dynamicField.type +
      (indexMapping.parentName ? "~" + indexMapping.parentName : "");

    switch (indexMapping.dynamicField.type) {
      // Managed Attribute (managedAttribute/[COMPONENT]/[MANAGED_ATTRIBUTE_KEY])
      case "managedAttribute":
        const managedAttributeValues: ManagedAttributeSearchStates =
          JSON.parse(dynamicFieldValue);
        return (
          dynamicFieldTypeWithRelationship +
          "/" +
          (indexMapping.dynamicField?.component ?? "ENTITY") +
          "/" +
          managedAttributeValues?.selectedManagedAttribute?.key
        );

      // Field Extension (fieldExtension/[COMPONENT]/[EXTENSION_PACKAGE]/[EXTENSION_KEY])
      case "fieldExtension":
        const fieldExtensionValues: FieldExtensionSearchStates =
          JSON.parse(dynamicFieldValue);
        return (
          dynamicFieldTypeWithRelationship +
          "/" +
          (indexMapping.dynamicField?.component ?? "ENTITY") +
          "/" +
          fieldExtensionValues?.selectedExtension +
          "/" +
          fieldExtensionValues?.selectedField
        );

      // Identifier (identifier/[IDENTIFIER_KEY])
      case "identifier":
        const identifierValues: IdentifierSearchStates =
          JSON.parse(dynamicFieldValue);
        return (
          dynamicFieldTypeWithRelationship +
          "/" +
          identifierValues.selectedIdentifier?.id
        );

      // Relationship Presence (relationshipPresence/[RELATIONSHIP]/[OPERATOR])
      case "relationshipPresence":
        const relationshipPresenceValues: RelationshipPresenceSearchStates =
          JSON.parse(dynamicFieldValue);
        return (
          // In the future, other operators can be supported.
          indexMapping.dynamicField.type +
          "/" +
          relationshipPresenceValues.selectedRelationship +
          "/" +
          "presence"
        );

      // Column Functions (functionId/functionDef/paramJson)
      case "columnFunction":
        const columnFunctionStateValues: FunctionDef =
          JSON.parse(dynamicFieldValue);
        const functionId = Object.keys(columnFunctionStateValues)[0];
        return (
          dynamicFieldTypeWithRelationship +
          "/" +
          functionId +
          "/" +
          columnFunctionStateValues[functionId].functionDef +
          (columnFunctionStateValues[functionId].params
            ? "/" + JSON.stringify(columnFunctionStateValues[functionId].params)
            : "")
        );

      // Classification (classification/[RANK])
      case "classification":
        const classificationValue: ClassificationSearchStates =
          JSON.parse(dynamicFieldValue);
        return (
          dynamicFieldTypeWithRelationship +
          "/" +
          classificationValue.selectedClassificationRank
        );

      // Image Link (imageLink/[TYPE])
      case "imageLink":
        const imageLinkValue: ImageLinkStates = JSON.parse(dynamicFieldValue);
        return (
          dynamicFieldTypeWithRelationship +
          "/" +
          imageLinkValue.selectedImageType
        );
    }
  }

  if (indexMapping.parentType) {
    return indexMapping.value;
  } else {
    return indexMapping.label;
  }
}

/**
 * Parses the relationship name from a dynamic field type string. Relationships are defined using
 * the '~' symbol.
 *
 * @param {string} dynamicFieldType - The dynamic field type string to parse.
 * @returns {string|undefined} The relationship name if found, otherwise undefined.
 */
export function parseRelationshipNameFromType(
  dynamicFieldType: string
): string | undefined {
  const tildeIndex = dynamicFieldType.indexOf("~");
  if (tildeIndex !== -1) {
    return dynamicFieldType.substring(tildeIndex + 1);
  }

  return undefined;
}

export interface GenerateColumnDefinitionProps<TData extends KitsuResource> {
  /** The index mapping for the field to be added. */
  indexMappings: ESIndexMapping[];

  /** Dynamic field mapping configuration. */
  dynamicFieldsMappingConfig?: DynamicFieldsMappingConfig;

  /** The path of the column to be generated. This is used to search against the index mappings. */
  path: string;

  /**
   * Preferred mappings to use instead of generating a new column.
   */
  defaultColumns?: TableColumn<TData>[];

  /**
   * API client to be used for generating the dynamic fields.
   */
  apiClient: Kitsu;
}

export async function generateColumnDefinition<TData extends KitsuResource>({
  indexMappings,
  dynamicFieldsMappingConfig,
  path,
  defaultColumns,
  apiClient
}: GenerateColumnDefinitionProps<TData>): Promise<
  TableColumn<TData> | undefined
> {
  // Link the path to a index mapping.
  const indexMapping = indexMappings.find(
    (mapping) => mapping.label === path || mapping.value === path
  );

  // Check if it's a dynamic field if it could not be found directly in the index mapping.
  if (!indexMapping || indexMapping?.dynamicField) {
    return await getDynamicFieldColumn(
      path,
      apiClient,
      dynamicFieldsMappingConfig,
      indexMappings
    );
  }

  // Check if it's a nested relationship.
  if (indexMapping.parentType) {
    // Check if it's mapped in the default columns, and just use that definition.
    const defaultColumnFound = defaultColumns?.find(
      (item) => item.id === indexMapping.value
    );
    if (defaultColumnFound) {
      return { ...defaultColumnFound, columnSelectorString: path };
    }

    return getNestedColumn(path, indexMapping);
  } else {
    // Check if it's mapped in the default columns, and just use that definition.
    const defaultColumnFound = defaultColumns?.find(
      (item) => item.id === indexMapping.label
    );
    if (defaultColumnFound) {
      return { ...defaultColumnFound, columnSelectorString: path };
    }

    return getEntityColumn(path, indexMapping);
  }
}

function getEntityColumn<TData extends KitsuResource>(
  path: string,
  indexColumn: ESIndexMapping
): TableColumn<TData> {
  if (indexColumn.type === "date") {
    return {
      ...dateCell(
        indexColumn?.label,
        indexColumn?.value,
        undefined,
        true,
        indexColumn
      ),
      columnSelectorString: path
    };
  } else {
    return {
      id: indexColumn.label,
      header: () => <FieldHeader name={indexColumn?.label} />,
      accessorKey: indexColumn?.value,
      isKeyword: indexColumn?.keywordMultiFieldSupport,
      columnSelectorString: path,
      enableSorting: indexColumn?.value === "id" ? false : true
    };
  }
}

function getNestedColumn<TData extends KitsuResource>(
  path: string,
  indexColumn: ESIndexMapping
): TableColumn<TData> {
  const accessorKeyRelationship = `${indexColumn.parentPath}.${indexColumn.parentName}`;
  const accessorKeyRelationshipAttribute = `${indexColumn.path}.${indexColumn.label}`;
  const accessorKeyFull = `${accessorKeyRelationship}.${accessorKeyRelationshipAttribute}`;
  const accessorKeyElasticSearch = `${indexColumn.parentPath}.${accessorKeyRelationshipAttribute}`;

  if (indexColumn.type === "date") {
    return {
      ...dateCell(
        indexColumn.value,
        accessorKeyElasticSearch,
        indexColumn.parentType,
        true,
        indexColumn
      ),
      columnSelectorString: path
    };
  } else {
    return {
      id: indexColumn.value,
      header: () => (
        <NestedColumnLabel
          label={indexColumn.label}
          relationship={indexColumn.parentName ?? ""}
        />
      ),
      accessorKey: accessorKeyElasticSearch,
      isKeyword: indexColumn.keywordMultiFieldSupport,
      isColumnVisible: true,
      cell: ({ row: { original } }) => {
        const value = _.get(original, accessorKeyRelationship);
        if (value && Array.isArray(value)) {
          const values = value
            .map((val) => _.get(val, accessorKeyRelationshipAttribute))
            .join(", ");
          return <>{values}</>;
        } else {
          const singleValue = _.get(original, accessorKeyFull);
          return <>{singleValue}</>;
        }
      },
      relationshipType: indexColumn.parentType,
      columnSelectorString: path
    };
  }
}

export interface NestedColumnLabelProps {
  label: string;
  relationship: string;
}

export function NestedColumnLabel({
  label,
  relationship
}: NestedColumnLabelProps) {
  const { formatMessage, messages } = useDinaIntl();

  const relationshipLabel = messages["title_" + relationship]
    ? formatMessage(("title_" + relationship) as any)
    : _.startCase(relationship);

  return <FieldHeader name={label} prefixName={relationshipLabel} />;
}

// Handle getting columns from query options that contain dynamicField
async function getDynamicFieldColumn<TData extends KitsuResource>(
  path: string,
  apiClient: Kitsu,
  dynamicFieldsMappingConfig?: DynamicFieldsMappingConfig,
  indexMappings?: ESIndexMapping[]
): Promise<TableColumn<TData> | undefined> {
  const pathParts = path.split("/");
  if (pathParts.length > 0) {
    // Handle managed attribute paths.
    if (
      dynamicFieldsMappingConfig &&
      pathParts.length === 3 &&
      pathParts[0].startsWith("managedAttribute")
    ) {
      const component = pathParts[1];
      const key = pathParts[2];
      const relationshipName = parseRelationshipNameFromType(pathParts[0]);

      return getManagedAttributesColumn(
        path,
        component,
        key,
        relationshipName,
        apiClient,
        dynamicFieldsMappingConfig
      );
    }

    // Handle field extension paths.
    if (
      dynamicFieldsMappingConfig &&
      pathParts.length === 4 &&
      pathParts[0].startsWith("fieldExtension")
    ) {
      const component = pathParts[1];
      const extension = pathParts[2];
      const field = pathParts[3];
      const relationshipName = parseRelationshipNameFromType(pathParts[0]);

      return getFieldExtensionColumn(
        path,
        component,
        extension,
        field,
        relationshipName,
        apiClient,
        dynamicFieldsMappingConfig
      );
    }

    // Handle identifier paths
    if (
      dynamicFieldsMappingConfig &&
      pathParts.length === 2 &&
      pathParts[0].startsWith("identifier")
    ) {
      const identifierKey = pathParts[1];
      const relationshipName = parseRelationshipNameFromType(pathParts[0]);

      return getVocabularyColumn(
        path,
        identifierKey,
        relationshipName,
        "identifier",
        apiClient,
        dynamicFieldsMappingConfig
      );
    }

    // Handle relationship presence paths.
    if (pathParts.length === 3 && pathParts[0] === "relationshipPresence") {
      const relationship = pathParts[1];
      const operator = pathParts[2];
      return getRelationshipPresenceFieldColumn(path, relationship, operator);
    }

    // Handle column functions paths
    if (pathParts.length >= 3 && pathParts[0] === "columnFunction") {
      const rawParams = pathParts.slice(3).join("/");
      const paramStr = rawParams ? "(" + rawParams + ")" : "";
      const fieldId = pathParts[1] + "." + pathParts[2] + paramStr;

      return {
        columnSelectorString: path,
        accessorKey: path,
        id: fieldId,
        header: () => {
          return (
            <FunctionFieldLabel
              functionFieldPath={path}
              indexMappings={indexMappings}
            />
          );
        },
        isKeyword: true,
        isColumnVisible: true
      };
    }

    // Handle scientific name details (classification) paths.
    if (
      dynamicFieldsMappingConfig &&
      pathParts.length === 2 &&
      pathParts[0] === "classification"
    ) {
      const relationshipName = parseRelationshipNameFromType(pathParts[0]);

      // Classifications are a vocabulary so we can reused the vocabulary functions.
      return getVocabularyColumn(
        path,
        pathParts[1],
        relationshipName,
        "classification",
        apiClient,
        dynamicFieldsMappingConfig
      );
    }

    // Handle image link paths
    if (
      dynamicFieldsMappingConfig &&
      pathParts.length === 2 &&
      pathParts[0] === "imageLink"
    ) {
      return getImageLinkColumn(path, pathParts[1]);
    }
  }

  // Unable to process path.
  return undefined;
}

async function getManagedAttributesColumn<TData extends KitsuResource>(
  path: string,
  component: string,
  key: string,
  relationshipName: string | undefined,
  apiClient: Kitsu,
  dynamicFieldsMappingConfig: DynamicFieldsMappingConfig
): Promise<TableColumn<TData> | undefined> {
  // API request params:
  const params = {
    filter: {
      ...(component !== "ENTITY" && { managedAttributeComponent: component }),
      key
    },
    page: { limit: 1 }
  };

  // Figure out API endpoint using the dynamicFieldsMappingConfig.
  const fieldConfigMatch = dynamicFieldsMappingConfig.fields.find((config) => {
    // Can't be a field config if a relationship name is provided.
    if (relationshipName !== undefined) {
      return false;
    }

    if (config.type === "managedAttribute" && config.component === component) {
      return true;
    }
  });
  const relationshipConfigMatch =
    dynamicFieldsMappingConfig.relationshipFields.find((config) => {
      // Can't be a relationship config if a relationship is not provided.
      if (relationshipName === undefined) {
        return false;
      }

      // Dynamic field type, component and the relationship need to match.
      if (
        config.type === "managedAttribute" &&
        config.component === component &&
        config.referencedBy === relationshipName
      ) {
        return true;
      }
    });

  if (!fieldConfigMatch && !relationshipConfigMatch) {
    console.error(
      "Managed Attribute Config for the following component: " +
        component +
        " could not be determined."
    );
    return;
  }
  if (fieldConfigMatch && relationshipConfigMatch) {
    console.error(
      "Managed Attribute Config found for both field and relationship side. Ensure dynamic configuration is correct."
    );
    return;
  }

  try {
    if (fieldConfigMatch) {
      // API request for the managed attribute.
      const managedAttribute = await fetchDynamicField(
        apiClient,
        fieldConfigMatch.apiEndpoint,
        params
      );

      if (managedAttribute?.[0]) {
        return getAttributesManagedAttributeColumn<TData>(
          path,
          managedAttribute?.[0],
          fieldConfigMatch
        );
      }
    }

    if (relationshipConfigMatch) {
      // API request for the managed attribute.
      const managedAttribute = await fetchDynamicField(
        apiClient,
        relationshipConfigMatch.apiEndpoint,
        params
      );
      if (managedAttribute?.[0]) {
        return getIncludedManagedAttributeColumn<TData>(
          path,
          managedAttribute?.[0],
          relationshipConfigMatch
        );
      }
    }
  } catch (error) {
    // Handle the error here, e.g., log it or display an error message.
    throw error;
  }

  return undefined;
}

export function getIncludedManagedAttributeColumn<TData extends KitsuResource>(
  path: string,
  managedAttribute: any,
  config: RelationshipDynamicField
): TableColumn<TData> {
  const managedAttributeKey = managedAttribute.key;
  const accessorKey = `${config.path}.${managedAttributeKey}`;

  const pathParts = config.path.split(".");
  const fieldName = pathParts[pathParts.length - 1];

  const managedAttributesColumn = {
    cell: ({ row: { original } }) => {
      const relationshipAccessor = accessorKey?.split(".");
      relationshipAccessor?.splice(
        1,
        0,
        config.referencedBy ? config.referencedBy : ""
      );
      const valuePath = relationshipAccessor?.join(".");
      const value = collectPathValues(original, valuePath);
      return <>{value}</>;
    },
    header: () => (
      <IncludedManagedAttributeLabel
        name={managedAttribute.name}
        relationship={config.referencedBy}
      />
    ),
    accessorKey,
    id: `${config.referencedBy}.${fieldName}.${managedAttributeKey}`,
    isKeyword: managedAttribute.vocabularyElementType === "STRING",
    isColumnVisible: true,
    relationshipType: config.referencedType,
    managedAttribute,
    config,
    columnSelectorString: path
  };

  return managedAttributesColumn;
}

export interface IncludedManagedAttributeLabelProps {
  name: string;
  relationship: string;
}

export function IncludedManagedAttributeLabel({
  name,
  relationship
}: IncludedManagedAttributeLabelProps) {
  const { messages, formatMessage } = useDinaIntl();

  const relationshipLabel = messages["title_" + relationship]
    ? formatMessage(("title_" + relationship) as any)
    : _.startCase(relationship);

  return (
    <>
      {relationshipLabel}
      {" - "}
      {_.startCase(name)}
    </>
  );
}

export function getAttributesManagedAttributeColumn<
  TData extends KitsuResource
>(
  path: string,
  managedAttribute: any,
  config: DynamicField
): TableColumn<TData> {
  const managedAttributeKey = managedAttribute.key;
  const accessorKey = `${config.path}.${managedAttributeKey}`;

  const pathParts = config.path.split(".");
  const fieldName = pathParts[pathParts.length - 1];

  const managedAttributesColumn = {
    header: () => <FieldHeader name={managedAttribute.name} />,
    accessorKey,
    id: `${fieldName}.${managedAttributeKey}`,
    isKeyword: managedAttribute.vocabularyElementType === "STRING",
    isColumnVisible: true,
    config,
    managedAttribute,
    sortDescFirst: true,
    columnSelectorString: path
  };

  return managedAttributesColumn;
}

// Get attribute and included extension values columns
async function getFieldExtensionColumn<TData extends KitsuResource>(
  path: string,
  component: string,
  extension: string,
  field: string,
  relationshipName: string | undefined,
  apiClient: Kitsu,
  dynamicFieldsMappingConfig: DynamicFieldsMappingConfig
): Promise<TableColumn<TData> | undefined> {
  // API request params:
  const params = {
    filter: {
      "extension.fields.dinaComponent": component,
      "extension.fields.key": field,
      "extension.key": extension
    },
    page: { limit: 1 }
  };

  // Figure out API endpoint using the dynamicFieldsMappingConfig.
  const fieldConfigMatch = dynamicFieldsMappingConfig.fields.find((config) => {
    // Can't be a field config if a relationship name is provided.
    if (relationshipName !== undefined) {
      return false;
    }

    if (config.type === "fieldExtension" && config.component === component) {
      return true;
    }
  });
  const relationshipConfigMatch =
    dynamicFieldsMappingConfig.relationshipFields.find((config) => {
      // Can't be a relationship config if a relationship is not provided.
      if (relationshipName === undefined) {
        return false;
      }

      // Dynamic field type, component and the relationship need to match.
      if (
        config.type === "fieldExtension" &&
        config.component === component &&
        config.referencedBy === relationshipName
      ) {
        return true;
      }
    });

  if (!fieldConfigMatch && !relationshipConfigMatch) {
    console.error(
      "Field Extension Config for the following component: " +
        component +
        " could not be determined."
    );
    return;
  }
  if (fieldConfigMatch && relationshipConfigMatch) {
    console.error(
      "Field Extension Config found for both field and relationship side. Ensure dynamic configuration is correct."
    );
    return;
  }

  try {
    if (fieldConfigMatch) {
      // API request for the field extension.
      const extensionValueRequest = await fetchDynamicField(
        apiClient,
        fieldConfigMatch.apiEndpoint,
        params
      );
      const extensionPackage = extensionValueRequest?.[0];
      const fieldDefinition =
        extensionValueRequest?.[0]?.extension?.fields?.find(
          (extensionField) => extensionField?.key === field
        );

      if (extensionPackage && fieldDefinition) {
        return getAttributeExtensionFieldColumn(
          path,
          fieldConfigMatch,
          extensionPackage,
          fieldDefinition
        );
      }
    }

    if (relationshipConfigMatch) {
      // API request for the field extension.
      const extensionValueRequest = await fetchDynamicField(
        apiClient,
        relationshipConfigMatch.apiEndpoint,
        params
      );
      const extensionPackage = extensionValueRequest?.[0];
      const fieldDefinition =
        extensionValueRequest?.[0]?.extension?.fields?.find(
          (extensionField) => extensionField?.key === field
        );

      if (extensionPackage && fieldDefinition) {
        return getIncludedExtensionFieldColumn(
          path,
          relationshipConfigMatch,
          extensionPackage,
          fieldDefinition
        );
      }
    }
  } catch (error) {
    // Handle the error here, e.g., log it or display an error message.
    throw error;
  }
}

export function getAttributeExtensionFieldColumn<TData extends KitsuResource>(
  path: string,
  config: DynamicField,
  extensionValue: any,
  extensionField: any
): TableColumn<TData> {
  const fieldExtensionResourceType = config.path.split(".").at(-1);
  const extensionValuesColumn = {
    accessorKey: `${config.path}.${extensionValue.id}.${extensionField.key}`,
    id: `${fieldExtensionResourceType}.${extensionValue.id}.${extensionField.key}`,
    header: () => `${extensionValue.extension.name} - ${extensionField.name}`,
    label: `${extensionValue.extension.name} - ${extensionField.name}`,
    isKeyword: true,
    isColumnVisible: true,
    config,
    extensionValue,
    extensionField,
    columnSelectorString: path
  };

  return extensionValuesColumn;
}

export function getIncludedExtensionFieldColumn(
  path: string,
  config: RelationshipDynamicField,
  extensionValue: any,
  extensionField: any
) {
  const fieldExtensionResourceType = config.path.split(".").at(-1);
  const accessorKey = `${config.path}.${extensionValue.id}.${extensionField.key}`;
  const extensionValuesColumn = {
    cell: ({ row: { original } }) => {
      const relationshipAccessor = accessorKey?.split(".");
      relationshipAccessor?.splice(
        1,
        0,
        config.referencedBy ? config.referencedBy : ""
      );
      const valuePath = relationshipAccessor?.join(".");
      const value = collectPathValues(original, valuePath);
      return <>{value}</>;
    },
    accessorKey,
    id: `${config.referencedBy}.${fieldExtensionResourceType}.${extensionValue.id}.${extensionField.key}`,
    header: () => (
      <IncludedExtensionFieldLabel
        extensionPackage={extensionValue?.extension?.name ?? ""}
        name={extensionField?.name ?? ""}
        relationship={config?.referencedBy ?? ""}
      />
    ),
    label: `${_.startCase(config.referencedBy)} - ${
      extensionValue.extension.name
    } - ${extensionField.name}`,
    isKeyword: true,
    isColumnVisible: true,
    relationshipType: config.referencedType,
    config,
    extensionValue,
    extensionField,
    columnSelectorString: path
  };

  return extensionValuesColumn;
}

export interface IncludedExtensionFieldLabelProps {
  extensionPackage: string;
  name: string;
  relationship: string;
}

export function IncludedExtensionFieldLabel({
  name,
  extensionPackage,
  relationship
}: IncludedExtensionFieldLabelProps) {
  const { messages, formatMessage } = useDinaIntl();

  const relationshipLabel = messages["title_" + relationship]
    ? formatMessage(("title_" + relationship) as any)
    : _.startCase(relationship);

  return (
    <>
      {relationshipLabel}
      {" - "}
      {extensionPackage}
      {" - "}
      {name}
    </>
  );
}

async function getVocabularyColumn<TData extends KitsuResource>(
  path: string,
  vocabularyKey: string,
  relationshipName: string | undefined,
  dynamicType: DynamicFieldType,
  apiClient: Kitsu,
  dynamicFieldsMappingConfig: DynamicFieldsMappingConfig
): Promise<TableColumn<TData> | undefined> {
  // API request params:
  const params = {
    page: { limit: 1 }
  };

  // Figure out API endpoint using the dynamicFieldsMappingConfig.
  const fieldConfigMatch = dynamicFieldsMappingConfig.fields.find((config) => {
    // Can't be a field config if a relationship name is provided.
    if (relationshipName !== undefined) {
      return false;
    }

    if (config.type === dynamicType) {
      return true;
    }
  });
  const relationshipConfigMatch =
    dynamicFieldsMappingConfig.relationshipFields.find((config) => {
      // Can't be a relationship config if a relationship is not provided.
      if (relationshipName === undefined) {
        return false;
      }

      // Dynamic field type, component and the relationship need to match.
      if (
        config.type === dynamicType &&
        config.referencedBy === relationshipName
      ) {
        return true;
      }
    });

  if (!fieldConfigMatch && !relationshipConfigMatch) {
    console.error(
      "Vocabulary Config could not be found in the dynamic fields mapping."
    );
    return;
  }
  if (fieldConfigMatch && relationshipConfigMatch) {
    console.error(
      "Vocabulary Config found for both field and relationship side. Ensure dynamic configuration is correct."
    );
    return;
  }

  try {
    if (fieldConfigMatch) {
      // API request for the vocabulary
      const vocabularyRequest = await fetchDynamicField(
        apiClient,
        fieldConfigMatch.apiEndpoint,
        params
      );

      // Find the Vocabulary Element based on the vocabulary key.
      const vocabularyElements =
        vocabularyRequest as any as VocabularyElement[];
      const elementsArray = Array.isArray(vocabularyElements)
        ? vocabularyElements
        : (vocabularyElements as any)?.vocabularyElements;
      const vocabularyElement = elementsArray.find(
        (vocab) => (vocab?.id || vocab.key) === vocabularyKey
      );

      if (vocabularyElement) {
        return getAttributeVocabularyColumn(
          path,
          vocabularyElement,
          fieldConfigMatch
        );
      }
    }

    if (relationshipConfigMatch) {
      // API request for the vocabularies
      const vocabularyRequest = await fetchDynamicField(
        apiClient,
        relationshipConfigMatch.apiEndpoint,
        params
      );

      // Find the Vocabulary Element based on the vocabulary key.
      const vocabularyElements =
        vocabularyRequest as any as VocabularyElement[];
      const elementsArray = Array.isArray(vocabularyElements)
        ? vocabularyElements
        : (vocabularyElements as any)?.vocabularyElements;
      const vocabularyElement = elementsArray.find(
        (vocab) => (vocab?.id || vocab.key) === vocabularyKey
      );

      if (vocabularyElement) {
        return getIncludedVocabularyColumn(
          path,
          vocabularyElement,
          relationshipConfigMatch
        );
      }
    }
  } catch (error) {
    // Handle the error here, e.g., log it or display an error message.
    throw error;
  }
}

export function getAttributeVocabularyColumn<TData extends KitsuResource>(
  path: string,
  vocabulary: VocabularyElement,
  config: DynamicField
): TableColumn<TData> {
  const accessorKey = `${config.path}.${vocabulary.key || vocabulary.id}`;
  const pathParts = config.path.split(".");
  const fieldName = pathParts[pathParts.length - 1];

  const vocabularyColumn = {
    header: () => <VocabularyFieldHeader vocabulary={vocabulary} />,
    accessorKey,
    id: `${fieldName}.${vocabulary.key || vocabulary.id}`,
    isKeyword: true,
    isColumnVisible: true,
    config,
    vocabulary,
    sortDescFirst: true,
    columnSelectorString: path
  };

  return vocabularyColumn;
}

export function getIncludedVocabularyColumn<TData extends KitsuResource>(
  path: string,
  vocabulary: VocabularyElement,
  config: RelationshipDynamicField
): TableColumn<TData> {
  const accessorKey = `${config.path}.${vocabulary.key || vocabulary.id}`;

  const pathParts = config.path.split(".");
  const fieldName = pathParts[pathParts.length - 1];

  const vocabularyColumn = {
    cell: ({ row: { original } }) => {
      const relationshipAccessor = accessorKey?.split(".");
      relationshipAccessor?.splice(
        1,
        0,
        config.referencedBy ? config.referencedBy : ""
      );
      const valuePath = relationshipAccessor?.join(".");
      const value = collectPathValues(original, valuePath);
      return <>{value}</>;
    },
    header: () => (
      <IncludedVocabularyLabel
        vocabulary={vocabulary}
        relationship={config.referencedBy}
      />
    ),
    accessorKey,
    id: `${config.referencedBy}.${fieldName}.${
      vocabulary.key || vocabulary.id
    }`,
    isKeyword: true,
    isColumnVisible: true,
    relationshipType: config.referencedType,
    vocabulary,
    config,
    columnSelectorString: path
  };

  return vocabularyColumn;
}

export interface IncludedVocabularyLabelProps {
  vocabulary: VocabularyElement;
  relationship: string;
}

export function IncludedVocabularyLabel({
  vocabulary,
  relationship
}: IncludedVocabularyLabelProps) {
  const { messages, formatMessage, locale } = useDinaIntl();

  const relationshipLabel = messages["title_" + relationship]
    ? formatMessage(("title_" + relationship) as any)
    : _.startCase(relationship);

  const label =
    vocabulary?.multilingualTitle?.titles?.find(
      (title) => title.lang === locale
    )?.title ?? vocabulary.id;

  return (
    <>
      {relationshipLabel}
      {" - "}
      {label}
    </>
  );
}

export function getRelationshipPresenceFieldColumn<TData extends KitsuResource>(
  path: string,
  relationship: string,
  operator: string
): TableColumn<TData> {
  return {
    accessorKey: `data.relationships`,
    id: `relationshipPresence.${relationship}.${operator}`,
    header: () => <RelationshipPresenceLabel relationship={relationship} />,
    cell: ({ row: { original } }) => {
      const relationshipExists = _.get(
        original,
        `data.relationships.${relationship}.data`
      );
      // Relationship could be an array or object.
      if (
        (Array.isArray(relationshipExists) && relationshipExists.length > 0) ||
        (relationshipExists as any)?.id
      ) {
        return <FaCheckSquare />;
      }

      // No relationship found.
      return <FaRegSquare />;
    },
    relationshipType: relationship,
    label: _.startCase(`${relationship}`),
    isKeyword: true,
    isColumnVisible: true,
    enableSorting: false,
    columnSelectorString: path
  };
}

export interface RelationshipPresenceLabelProps {
  relationship: string;
}

/**
 * Component used for generating the relationship presence label with locale support.
 * @param relationship Relationship being displayed
 * @returns String with the label
 */
export function RelationshipPresenceLabel({
  relationship
}: RelationshipPresenceLabelProps) {
  const { formatMessage, messages } = useDinaIntl();

  const relationshipLabel = messages["title_" + relationship]
    ? formatMessage(("title_" + relationship) as any)
    : _.startCase(relationship);

  return (
    <>
      {formatMessage("field__relationshipPresence_column", {
        relationshipName: relationshipLabel
      })}
    </>
  );
}

// Fetch filtered dynamic field from back end
async function fetchDynamicField(apiClient: Kitsu, path, params?: GetParams) {
  try {
    const { data } = await apiClient.get(path, params ?? {});
    return data;
  } catch {
    return undefined;
  }
}

/**
 * Function to get values from an object using a path, collecting all values when encountering arrays.
 * If the path leads to an array at any point, it collects values from all elements
 * and returns them as a semi-colon separated string.
 *
 * @param {object} object - The object to search in.
 * @param {string} path - The path to the desired value(s).
 * @returns {any} - The value or semi-colon separated values at the specified path, or undefined if not found.
 */
export function collectPathValues(object: any, path: string): any {
  if (!path) return object;

  const parts = path.split(".");
  const part = parts[0];
  const remainingPath = parts.slice(1).join(".");

  if (object === null || object === undefined) return undefined;

  if (Array.isArray(object[part])) {
    // If we've reached the end of the path and found an array, return its elements joined
    if (parts.length === 1) {
      return object[part].join("; ");
    }

    // Process each array element recursively and join the results
    const results = object[part]
      .map((item) => collectPathValues(item, remainingPath))
      .filter((result) => result !== undefined);

    return results.length ? results.join("; ") : undefined;
  } else {
    // Continue traversing if not an array
    if (parts.length === 1) {
      return object[part];
    }

    return collectPathValues(object[part], remainingPath);
  }
}

export interface FunctionFieldLabelProps {
  functionFieldPath: string;
  indexMappings?: ESIndexMapping[];
}

export function FunctionFieldLabel({
  functionFieldPath,
  indexMappings
}: FunctionFieldLabelProps) {
  const { messages, formatMessage } = useDinaIntl();
  const pathParts = functionFieldPath.split("/");

  if (pathParts.length >= 3 && pathParts[0] === "columnFunction") {
    const functionName = pathParts[2];

    // Rejoin the remaining parts because the JSON might contain slashes (e.g. URLs)
    const paramJsonStr =
      pathParts.length > 3 ? pathParts.slice(3).join("/") : undefined;

    let rawValues: string[] = [];

    // Helper to recursively extract all string values from the JSON structure
    const extractStringValues = (obj: any): string[] => {
      if (typeof obj === "string") return [obj];
      if (Array.isArray(obj)) {
        return obj.flatMap(extractStringValues);
      }
      if (typeof obj === "object" && obj !== null) {
        return Object.values(obj).flatMap(extractStringValues);
      }
      return [];
    };

    if (paramJsonStr) {
      try {
        const parsed = JSON.parse(paramJsonStr);
        rawValues = extractStringValues(parsed);
      } catch (e) {
        // Fallback if parsing fails, though unlikely if generated correctly
        console.error("Failed to parse column function params", e);
      }
    }

    const paramObjects = _.compact(
      rawValues.map((field) => {
        const mappingMatch = indexMappings?.find((mapping) =>
          mapping.parentName
            ? mapping.value === field ||
              field.includes(`${mapping.parentName}.${mapping.label}`)
            : mapping.label === field
        );

        if (!mappingMatch) return undefined;

        // Create new object instead of referencing object from indexMappings
        const paramObject = { ...mappingMatch };

        if (paramObject.parentName && paramObject.value !== field) {
          paramObject.label = field.replace(paramObject.parentName, "");
        }

        return paramObject;
      })
    );

    const formattedParamStr =
      paramObjects && paramObjects.length > 0
        ? " (" +
          paramObjects
            ?.map((field) => {
              return (
                (field.parentName
                  ? (messages[field.parentName]
                      ? formatMessage(field.parentName as any)
                      : _.startCase(field.parentName)) + " "
                  : "") +
                (messages[field.label]
                  ? formatMessage(field.label as any)
                  : _.startCase(field.label))
              );
            })
            .join(" + ") +
          ")"
        : "";

    return (
      <span>{formatMessage(functionName as any) + formattedParamStr}</span>
    );
  } else {
    return <></>;
  }
}
