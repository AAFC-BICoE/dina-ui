import { ColumnDef } from "@tanstack/react-table";
import { KitsuResource } from "kitsu";

/**
 * This type extends the react-table column type, this just adds a few specific fields for elastic
 * search mapping and internationalization.
 */

export type TableColumn<TData extends KitsuResource> = ColumnDef<TData> & {
  /**
   * User-friendly column to be displayed. You can use a DinaMessage key for internationalization.
   */
  label?: string;

  /**
   * Elastic search path to the attribute.
   *
   * Example: `data.attributes.name`
   */
  attributePath?: string;

  /**
   * This field is used to find the relationship in the included section.
   */
  relationshipType?: string;

  /**
   * Is this attribute considered a keyword in elastic search. Required for filtering and sorting.
   */
  isKeyword?: boolean;

  /**
   * The QueryPage will only display the accessors that are displayed on the result table. However,
   * if you have custom cells that receive other fields you will need to add them to this list so
   * elastic search includes the fields in the result.
   *
   * Example: `data.attributes.name`
   *
   * Please note that duplicate fields are automatically removed so you don't need to worry about
   * having unique accessors.
   */
  additionalAccessors?: string[];

  isColumnVisible?: boolean;

  queryOption?: any;

  /**
   * Used for storing the column selector string, for local storage purposes.
   */
  columnSelectorString?: string;

  /**
   * Used for the column exporter to allow the user to
   */
  exportHeader?: string;
};

/**
 * Data type of Column functions to export.
 *
 * For example:
 *
 * {
 *    "function1": {
 *      "functionName":"CONVERT_COORDINATES_DD",
 *      "params":["collectingEvent.eventGeom"]
 *    }
 *  }
 */

export interface ColumnFunctions {
  [functionId: string]: {
    functionName: string;
    params: string[];
  };
}

/**
 * The full path will be generated for elastic using a combination of the parent path and
 * the value. The path is generated using the following:
 *
 * {parentPath}.{path}.{value}
 *
 * Example: included.attributes.determination.verbatimScientificName
 */
export interface ESIndexMapping {
  /**
   * Name of the attribute.
   *
   * Example: verbatimScientificName
   */
  value: string;

  /**
   * Text that is displayed to the user in the Query Filtering option menu.
   *
   * This text is a user-friendly generated label, which may show some paths to help the user
   * understand the relationships better. This is generated from the path.
   *
   * Example: determination.verbatimScientificName
   */
  label: string;

  /**
   * Determines if the field should be displayed on the field selector.
   */
  hideField: boolean;

  /**
   * The attributes type. This can change how the query row is displayed and the options provided.
   *
   * Examples: text, keyword, boolean, date, boolean, long, short, integer...
   */
  type: string;

  /**
   * Currently used for dates to describe if it's a local_date (where timezone should not be applied)
   * but can be expanded to other types in the future.
   */
  subType?: string;

  /**
   * If enabled, it will allow the user to see suggestions as they type. The suggestions will come
   * from elastic search based on most common values saved.
   *
   * Only available for the text type.
   */
  distinctTerm: boolean;

  /**
   * All text fields will support prefixes, but some fields are optimized with a "prefix" field.
   *
   * When enabled, the elastic search query will append a ".prefix" to the end of the field to use
   * the optimized prefix.
   */
  optimizedPrefix: boolean;

  /**
   * If enabled it will allow the user to search based in the middle of a word.
   *
   * Example: Hexapoda can be matched with "pod".
   */
  containsSupport: boolean;

  /**
   * If enabled it will allow the user to search based on the ending of a word.
   *
   * Example: Hexapoda can be matched with "poda".
   */
  endsWithSupport: boolean;

  /**
   * In elastic search you can have multiple fields on an attribute, for example:
   *
   *  <pre>
   *  "acCaption": {
   *    "type": "text",
   *    "fields": {
   *      "keyword": {
   *        "type": "keyword",
   *        "ignore_above": 256
   *      }
   *    }
   *  }
   *  </pre>
   *
   * The `acCaption` is indexed in two different ways here but contains an extra version for keyword
   * type. In this case the keywordMultiFieldSupport would be true since it's not the default but it
   * is supported. If true, the ".keyword" will be appended to the field name to access the keyword
   * version if required.
   */
  keywordMultiFieldSupport: boolean;

  /**
   * Attribute contains a "keyword_numeric" field. If true, this will enable the "Between" operator
   * for text types.
   */
  keywordNumericSupport: boolean;

  /**
   * The path for the attribute without the attribute name. This path does not include the parent
   * path.
   *
   * Example: attribute.determination
   */
  path: string;

  /**
   * If the attribute belongs to a relationship, this is the path for only the parent. When generating
   * the elastic search query it will use this as the prefix of the path.
   *
   * Example: included
   */
  parentPath?: string;

  /**
   * If the attribute belongs to a relationship, this is the name which will be used to group
   * attributes under the same relationship together in the search. This name will also be used to
   * display text of the group.
   *
   * This text should match the user-friendly label in the locales files. It will be searched using
   * title_[parentName].
   *
   * Example: preparationMethod (and the label will be `title_preparationMethod`)
   */
  parentName?: string;

  /**
   * The parent type is the relationship type to be used. This will be used for elastic search
   * filtering. The reason this is used since the same field can be used for multiple relationships.
   *
   * Example: preparation-method
   */
  parentType?: string;

  /**
   * Reverse relationships are found in the included section but not in the relationships section.
   * This flag is used to determine if the relationship is a reverse relationship.
   */
  isReverseRelationship?: boolean;

  /**
   * Only provided if it was added using a dynamic field config.
   */
  dynamicField?: DynamicField;
}

/**
 * Each type on the query builder has a function that is used to transform the query builder row
 * into elastic search logic.
 *
 * @see QueryBuilderElasticSearchExport
 * @see QueryRowTextSearch
 */
export interface TransformToDSLProps {
  /**
   * The query builder type, not really used but required in the function for the QueryBuilder
   * library.
   *
   * For the Elastic Search type you can use the fieldInfo.type instead.
   */
  queryType: string;

  /**
   * The value to search against. If the type is "text" then this is the text that will be filtered.
   */
  value: string;

  /**
   * The operation being performed.
   *
   * For example:
   * "equals", "notEquals", "containsText"
   *
   * Operators are defined in the QueryBuilderConfig file.
   */
  operation: string;

  /**
   * This field path is the unique path given to each item in the field list.
   *
   * For getting the proper absolute field path, use the FieldInfo to generate it.
   */
  fieldPath: string;

  /**
   * The elastic search mapping for the field.
   */
  fieldInfo?: ESIndexMapping;

  /**
   * All elastic search mapping fields. Used for managed attributes/field extensions.
   */
  indexMap?: ESIndexMapping[];
}

/**
 * Dynamic field types supported by the Query Builder.
 *
 * "unsupported" will just hide the options without generating the single option.
 */
export const DYNAMIC_FIELD_TYPES = [
  "unsupported",
  "managedAttribute",
  "fieldExtension",
  "identifier",
  "relationshipPresence",
  "classification",
  "columnFunction",
  "vocabulary"
] as const;
export type DynamicFieldType = (typeof DYNAMIC_FIELD_TYPES)[number];

/**
 * Utility function to check if a string matches one of the dynamic field types.
 *
 * @param value type to check.
 * @returns true if match found, otherwise false.
 */
export function isDynamicFieldType(value: string): value is DynamicFieldType {
  return (DYNAMIC_FIELD_TYPES as readonly string[]).includes(value);
}

export interface DynamicFieldsMappingConfig {
  /** Attribute level dynamic fields */
  fields: DynamicField[];

  /** Dynamic fields for relationships */
  relationshipFields: RelationshipDynamicField[];
}

export interface DynamicField {
  /**
   * Option label that should be used.
   */
  label: string;

  type: DynamicFieldType;

  path: string;

  /**
   * Endpoint where these dynamic fields can be retrieved to list.
   *
   * Example: "collection-api/managed-attribute"
   */
  apiEndpoint?: string;

  /**
   * Optional field to indicate which Managed Attributes or Field Extensions should be listed.
   */
  component?: string;
}

/**
 * Configuration for where the Dynamic Field can be found within the relationship index mapping.
 */
export interface RelationshipDynamicField extends DynamicField {
  referencedBy: string;
  referencedType: string;
}
