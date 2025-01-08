import Kitsu, { GetParams, KitsuResource } from "kitsu";
import { compact, get, startCase } from "lodash";
import { IdentifierType } from "packages/dina-ui/types/collection-api/resources/IdentifierType";
import { FaCheckSquare, FaRegSquare } from "react-icons/fa";
import { FieldHeader, dateCell } from "..";
import { VocabularyFieldHeader } from "../../../../packages/dina-ui/components";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { FieldExtensionSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderFieldExtensionSearch";
import { IdentifierSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderIdentifierSearch";
import { ManagedAttributeSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";
import { RelationshipPresenceSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderRelationshipPresenceSearch";
import { ColumnFunctionSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryRowColumnFunctionInput";
import {
  DynamicField,
  DynamicFieldsMappingConfig,
  ESIndexMapping,
  RelationshipDynamicField,
  TableColumn
} from "../list-page/types";

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
          indexMapping.dynamicField.type +
          "/" +
          relationshipPresenceValues.selectedRelationship +
          "/" +
          "presence" // In the future, other operators can be supported.
        );

      // Column Functions (functionId/functionName/params)
      case "columnFunction":
        const columnFunctionStateValues: ColumnFunctionSearchStates =
          JSON.parse(dynamicFieldValue);
        const functionId = Object.keys(columnFunctionStateValues)[0];
        return (
          dynamicFieldTypeWithRelationship +
          "/" +
          functionId +
          "/" +
          columnFunctionStateValues[functionId].functionName +
          (columnFunctionStateValues[functionId].params
            ? "/" +
              columnFunctionStateValues[functionId].params
                .map((field) =>
                  field.parentName
                    ? field.value
                    : field.value.replace(field.path + ".", "")
                )
                .join("+")
            : "")
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
export function parseRelationshipNameFromType(dynamicFieldType) {
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
        const value = get(original, accessorKeyRelationship);
        if (value && Array.isArray(value)) {
          const values = value
            .map((val) => get(val, accessorKeyRelationshipAttribute))
            .join(", ");
          return <>{values}</>;
        } else {
          const singleValue = get(original, accessorKeyFull);
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
    : startCase(relationship);

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

      return getIdentifierColumn(
        path,
        identifierKey,
        relationshipName,
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
      const paramStr = pathParts.length > 3 ? "(" + pathParts[3] + ")" : "";
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
      managedAttributeComponent: component,
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
      "Identifier Config found for both field and relationship side. Ensure dynamic configuration is correct."
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
        config.referencedType ? config.referencedType : ""
      );
      const valuePath = relationshipAccessor?.join(".");
      const value = get(original, valuePath);
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
    : startCase(relationship);

  return (
    <>
      {relationshipLabel}
      {" - "}
      {startCase(name)}
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
      "Identifier Config found for both field and relationship side. Ensure dynamic configuration is correct."
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
        config.referencedType ? config.referencedType : ""
      );
      const valuePath = relationshipAccessor?.join(".");
      const value = get(original, valuePath);
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
    label: `${startCase(config.referencedBy)} - ${
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
    : startCase(relationship);

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

async function getIdentifierColumn<TData extends KitsuResource>(
  path: string,
  identifierKey: string,
  relationshipName: string | undefined,
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

    if (config.type === "identifier") {
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
        config.type === "identifier" &&
        config.referencedBy === relationshipName
      ) {
        return true;
      }
    });

  if (!fieldConfigMatch && !relationshipConfigMatch) {
    console.error(
      "Identifier Config could not be found in the dynamic fields mapping."
    );
    return;
  }
  if (fieldConfigMatch && relationshipConfigMatch) {
    console.error(
      "Identifier Config found for both field and relationship side. Ensure dynamic configuration is correct."
    );
    return;
  }

  try {
    if (fieldConfigMatch) {
      // API request for the identifiers
      const identifierRequest = await fetchDynamicField(
        apiClient,
        fieldConfigMatch.apiEndpoint,
        params
      );

      // Find the Vocabulary Element based on the identifier key.
      const vocabularyElements = identifierRequest as any as IdentifierType[];
      const vocabularyElement = vocabularyElements.find(
        (vocab) => vocab.id === identifierKey
      );

      if (vocabularyElement) {
        return getAttributeIdentifierColumn(
          path,
          vocabularyElement,
          fieldConfigMatch
        );
      }
    }

    if (relationshipConfigMatch) {
      // API request for the identifiers
      const identifierRequest = await fetchDynamicField(
        apiClient,
        relationshipConfigMatch.apiEndpoint,
        params
      );

      // Find the Vocabulary Element based on the identifier key.
      const vocabularyElements = identifierRequest as any as IdentifierType[];
      const vocabularyElement = vocabularyElements.find(
        (vocab) => vocab.id === identifierKey
      );

      if (vocabularyElement) {
        return getIncludedIdentifierColumn(
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

export function getAttributeIdentifierColumn<TData extends KitsuResource>(
  path: string,
  identifier: IdentifierType,
  config: DynamicField
): TableColumn<TData> {
  const accessorKey = `${config.path}.${identifier.id}`;
  const pathParts = config.path.split(".");
  const fieldName = pathParts[pathParts.length - 1];

  const identifierColumn = {
    header: () => <VocabularyFieldHeader vocabulary={identifier} />,
    accessorKey,
    id: `${fieldName}.${identifier.id}`,
    isKeyword: true,
    isColumnVisible: true,
    config,
    identifier,
    sortDescFirst: true,
    columnSelectorString: path
  };

  return identifierColumn;
}

export function getIncludedIdentifierColumn<TData extends KitsuResource>(
  path: string,
  identifier: IdentifierType,
  config: RelationshipDynamicField
): TableColumn<TData> {
  const accessorKey = `${config.path}.${identifier.id}`;

  const pathParts = config.path.split(".");
  const fieldName = pathParts[pathParts.length - 1];

  const identifierColumn = {
    cell: ({ row: { original } }) => {
      const relationshipAccessor = accessorKey?.split(".");
      relationshipAccessor?.splice(
        1,
        0,
        config.referencedType ? config.referencedType : ""
      );
      const valuePath = relationshipAccessor?.join(".");
      const value = get(original, valuePath);
      return <>{value}</>;
    },
    header: () => (
      <IncludedIdentifierLabel
        identifierVocabulary={identifier}
        relationship={config.referencedBy}
      />
    ),
    accessorKey,
    id: `${config.referencedBy}.${fieldName}.${identifier.id}`,
    isKeyword: true,
    isColumnVisible: true,
    relationshipType: config.referencedType,
    identifier,
    config,
    columnSelectorString: path
  };

  return identifierColumn;
}

export interface IncludedIdentifierLabelProps {
  identifierVocabulary: IdentifierType;
  relationship: string;
}

export function IncludedIdentifierLabel({
  identifierVocabulary,
  relationship
}: IncludedIdentifierLabelProps) {
  const { messages, formatMessage, locale } = useDinaIntl();

  const relationshipLabel = messages["title_" + relationship]
    ? formatMessage(("title_" + relationship) as any)
    : startCase(relationship);

  const label =
    identifierVocabulary?.multilingualTitle?.titles?.find(
      (title) => title.lang === locale
    )?.title ?? identifierVocabulary.id;

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
      const relationshipExists = get(
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
    label: startCase(`${relationship}`),
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
    : startCase(relationship);

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
    const paramStr = pathParts.length > 3 ? pathParts[3] : undefined;
    const paramObjects = compact(
      paramStr
        ?.split("+")
        .map((field) =>
          indexMappings?.find((mapping) =>
            mapping.parentName
              ? mapping.value === field
              : mapping.value === mapping.path + "." + field
          )
        )
    );
    const formattedParamStr =
      paramObjects && paramObjects.length > 0
        ? " (" +
          paramObjects
            ?.map(
              (field) =>
                (field.parentName
                  ? (messages[field.parentName]
                      ? formatMessage(field.parentName as any)
                      : startCase(field.parentName)) + " "
                  : "") +
                (messages[field.label]
                  ? formatMessage(field.label as any)
                  : startCase(field.label))
            )
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
