// Primitive data types are static and do not allow for any additional values to be appended to the path.
export enum WorkbookDataTypePrimitive {
  NUMBER = "number",
  BOOLEAN = "boolean",
  STRING = "string",
  STRING_COORDINATE = "letter",
  DATE = "date",
  DATE_TIME = "date-time",
  STRING_ARRAY = "string[]",
  NUMBER_ARRAY = "number[]",
  BOOLEAN_ARRAY = "boolean[]",
  ENUM = "enum",
  OBJECT = "object",
  OBJECT_ARRAY = "object[]"
}

// All these data types are dynamic and might allow for the specific values to be appended to the path.
// Example: "managedAttributes" might be "managedAttributes.someAttribute" or "managedAttributes.someAttribute.someSubAttribute".
export enum WorkbookDataTypeDynamic {
  MANAGED_ATTRIBUTES = "managedAttributes",
  VOCABULARY = "vocabulary",
  CONTROLLED_VOCABULARY = "controlledVocabulary",
  CLASSIFICATION = "classification"
}

// Combine the two enums into a single type for use in the workbook generator and other components.
export const WorkbookDataTypeEnum = {
  ...WorkbookDataTypePrimitive,
  ...WorkbookDataTypeDynamic
} as const;

export type WorkbookDataTypeEnum =
  | WorkbookDataTypePrimitive
  | WorkbookDataTypeDynamic;
