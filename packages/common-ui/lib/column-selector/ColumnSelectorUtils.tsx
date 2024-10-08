import { FieldHeader, dateCell } from "..";
import {
  DynamicField,
  DynamicFieldsMappingConfig,
  ESIndexMapping,
  RelationshipDynamicField,
  TableColumn
} from "../list-page/types";
import Kitsu, { GetParams, KitsuResource } from "kitsu";
import { get, startCase } from "lodash";
import React from "react";
import { ManagedAttributeSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";
import { FieldExtensionSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderFieldExtensionSearch";
import { RelationshipPresenceSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderRelationshipPresenceSearch";
import { FaCheckSquare, FaRegSquare } from "react-icons/fa";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { IdentifierSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderIdentifierSearch";
import { VocabularyElement } from "packages/dina-ui/types/collection-api";
import { VocabularyFieldHeader } from "../../../../packages/dina-ui/components";
import { IdentifierType } from "packages/dina-ui/types/collection-api/resources/IdentifierType";

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
    switch (indexMapping.dynamicField.type) {
      // Managed Attribute (managedAttribute/[COMPONENT]/[MANAGED_ATTRIBUTE_KEY])
      case "managedAttribute":
        const managedAttributeValues: ManagedAttributeSearchStates =
          JSON.parse(dynamicFieldValue);
        return (
          indexMapping.dynamicField.type +
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
          indexMapping.dynamicField.type +
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
          indexMapping.dynamicField.type +
          "/" +
          identifierValues.selectedIdentifier
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
    }
  }

  if (indexMapping.parentType) {
    return indexMapping.value;
  } else {
    return indexMapping.label;
  }
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
      dynamicFieldsMappingConfig
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
  const accessorKey = `${indexColumn.parentPath}.${
    indexColumn.path.split(".")[0]
  }.${indexColumn.label}`;

  if (indexColumn.type === "date") {
    return {
      ...dateCell(
        indexColumn.value,
        accessorKey,
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
        <FieldHeader
          name={indexColumn.label}
          prefixName={startCase(indexColumn.parentName)}
        />
      ),
      accessorKey,
      isKeyword: indexColumn.keywordMultiFieldSupport,
      isColumnVisible: true,
      cell: ({ row: { original } }) => {
        const relationshipAccessor = accessorKey?.split(".");
        relationshipAccessor?.splice(
          1,
          0,
          indexColumn.parentType ? indexColumn.parentType : ""
        );
        const valuePath = relationshipAccessor?.join(".");
        const value = get(original, valuePath);
        return <>{value}</>;
      },
      relationshipType: indexColumn.parentType,
      columnSelectorString: path
    };
  }
}

// Handle getting columns from query options that contain dynamicField
async function getDynamicFieldColumn<TData extends KitsuResource>(
  path: string,
  apiClient: Kitsu,
  dynamicFieldsMappingConfig?: DynamicFieldsMappingConfig
): Promise<TableColumn<TData> | undefined> {
  const pathParts = path.split("/");
  if (pathParts.length > 0) {
    // Handle managed attribute paths.
    if (
      dynamicFieldsMappingConfig &&
      pathParts.length === 3 &&
      pathParts[0] === "managedAttribute"
    ) {
      const component = pathParts[1];
      const key = pathParts[2];
      return getManagedAttributesColumn(
        path,
        component,
        key,
        apiClient,
        dynamicFieldsMappingConfig
      );
    }

    // Handle field extension paths.
    if (
      dynamicFieldsMappingConfig &&
      pathParts.length === 4 &&
      pathParts[0] === "fieldExtension"
    ) {
      const component = pathParts[1];
      const extension = pathParts[2];
      const field = pathParts[3];
      return getFieldExtensionColumn(
        path,
        component,
        extension,
        field,
        apiClient,
        dynamicFieldsMappingConfig
      );
    }

    // Handle identifier paths
    if (
      dynamicFieldsMappingConfig &&
      pathParts.length === 2 &&
      pathParts[0] === "identifier"
    ) {
      const identifierKey = pathParts[1];
      return getIdentifierColumn(
        path,
        identifierKey,
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
  }

  // Unable to process path.
  return undefined;
}

async function getManagedAttributesColumn<TData extends KitsuResource>(
  path: string,
  component: string,
  key: string,
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
  const fieldConfigMatch = dynamicFieldsMappingConfig.fields.find(
    (config) =>
      config.type === "managedAttribute" && config.component === component
  );
  const relationshipConfigMatch =
    dynamicFieldsMappingConfig.relationshipFields.find(
      (config) =>
        config.type === "managedAttribute" && config.component === component
    );

  if (!fieldConfigMatch && !relationshipConfigMatch) {
    console.error(
      "Managed Attribute Config for the following component: " +
        component +
        " could not be determined."
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

      if (managedAttribute[0]) {
        return getAttributesManagedAttributeColumn<TData>(
          path,
          managedAttribute[0],
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
      if (managedAttribute[0]) {
        return getIncludedManagedAttributeColumn<TData>(
          path,
          managedAttribute[0],
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
    header: () => <FieldHeader name={managedAttribute.name} />,
    accessorKey,
    id: `${config.referencedBy}.${config.label}.${managedAttributeKey}`,
    isKeyword: managedAttribute.vocabularyElementType === "STRING",
    isColumnVisible: true,
    relationshipType: config.referencedType,
    managedAttribute,
    config,
    columnSelectorString: path
  };

  return managedAttributesColumn;
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
  const managedAttributesColumn = {
    header: () => <FieldHeader name={managedAttribute.name} />,
    accessorKey,
    id: `${config.label}.${managedAttributeKey}`,
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
  const fieldConfigMatch = dynamicFieldsMappingConfig.fields.find(
    (config) =>
      config.type === "fieldExtension" && config.component === component
  );
  const relationshipConfigMatch =
    dynamicFieldsMappingConfig.relationshipFields.find(
      (config) =>
        config.type === "fieldExtension" && config.component === component
    );

  if (!fieldConfigMatch && !relationshipConfigMatch) {
    console.error(
      "Field Extension Config for the following component: " +
        component +
        " could not be determined."
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
    header: () => `${extensionValue.extension.name} - ${extensionField.name}`,
    label: `${extensionValue.extension.name} - ${extensionField.name}`,
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

async function getIdentifierColumn<TData extends KitsuResource>(
  path: string,
  identifierKey: string,
  apiClient: Kitsu,
  dynamicFieldsMappingConfig: DynamicFieldsMappingConfig
): Promise<TableColumn<TData> | undefined> {
  // API request params:
  const params = {
    page: { limit: 1 }
  };

  // Figure out API endpoint using the dynamicFieldsMappingConfig.
  const fieldConfigMatch = dynamicFieldsMappingConfig.fields.find(
    (config) => config.type === "identifier"
  );
  const relationshipConfigMatch =
    dynamicFieldsMappingConfig.relationshipFields.find(
      (config) => config.type === "identifier"
    );

  if (!fieldConfigMatch && !relationshipConfigMatch) {
    console.error(
      "Identifier Config could not be found in the dynamic fields mapping."
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
  const identifierColumn = {
    header: () => <VocabularyFieldHeader vocabulary={identifier} />,
    accessorKey,
    id: `${config.label}.${identifier.id}`,
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
    header: () => <VocabularyFieldHeader vocabulary={identifier} />,
    accessorKey,
    id: `${config.referencedBy}.${config.label}.${identifier.id}`,
    isKeyword: true,
    isColumnVisible: true,
    relationshipType: config.referencedType,
    identifier,
    config,
    columnSelectorString: path
  };

  return identifierColumn;
}

export function getRelationshipPresenceFieldColumn<TData extends KitsuResource>(
  path: string,
  relationship: string,
  operator: string
): TableColumn<TData> {
  return {
    accessorKey: `data.relationships`,
    id: `relationshipPresence.${relationship}.${operator}`,
    header: () => (
      <DinaMessage
        id="field__relationshipPresence_column"
        values={{ relationshipName: startCase(relationship) }}
      />
    ),
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

// Fetch filtered dynamic field from back end
async function fetchDynamicField(apiClient: Kitsu, path, params?: GetParams) {
  const { data } = await apiClient.get(path, params ?? {});
  return data;
}
