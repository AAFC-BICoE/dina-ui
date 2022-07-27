import { KitsuResource } from "kitsu";
import { Column } from "react-table";

/**
 * This type extends the react-table column type, this just adds a few specific fields for elastic
 * search mapping and internationalization.
 */
export interface TableColumn<TData extends KitsuResource>
  extends Column<TData> {
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
   * The attributes type. This can change how the query row is displayed and the options provided.
   *
   * Examples: text, keyword, boolean, date, boolean, long, short, integer...
   */
  type: string;

  /**
   * If enabled, it will allow the user to see suggestions as they type. The suggestions will come
   * from elastic search based on most common values saved.
   *
   * Only available for the text type.
   */
  distinctTerm: boolean;

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
}

/**
 * Used to determine what type to display for a query row.
 */
export interface TypeVisibility {
  /** Display a text box only */
  isText: boolean;

  /** Display a text box with a dropdown of suggestions based on distinct elastic search values. */
  isSuggestedText: boolean;

  /** Display a dropdown with true or false. */
  isBoolean: boolean;

  /** Display a text box with number input only. */
  isNumber: boolean;

  /** Display a text box with date picker. */
  isDate: boolean;
}

/**
 * The Match Type values. This will be used for dropdown inputs.
 */
export type QueryRowMatchValue = "match" | "term";

/**
 * The Match Type labels. What will be displayed to the user.
 */
export type QueryRowMatchType = "PARTIAL_MATCH" | "EXACT_MATCH" | "BLANK_FIELD";

/**
 * Boolean values to be displayed in the dropdown.
 */
export type QueryRowBooleanType = "TRUE" | "FALSE";

/**
 * The types that will be considered a number and use the number type.
 */
export type QueryRowNumberType =
  | "long"
  | "short"
  | "integer"
  | "byte"
  | "double"
  | "float"
  | "half_float"
  | "scaled_float"
  | "unsigned_long";
