import { InputResource, KitsuResource } from "kitsu";
import { WorkbookDataTypeEnum } from "./WorkbookDataTypeEnum";

export enum LinkOrCreateSetting {
  LINK = "LINK", // Find the existing object then set to relationships. It will ignore if not found.
  CREATE = "CREATE", // Create a new object then set to relationships
  LINK_OR_CREATE = "LINK_OR_CREATE", // Try to find an existing object, if not found, then create one, then set to relationships
  LINK_OR_ERROR = "LINK_OR_ERROR" // Try to find an existing object, if not found, then throw an new error
}

/**
 * A specific row on a spreadsheet.
 */
export interface WorkbookRow {
  rowNumber: number;
  content: string[];
}

/**
 * A spreadsheet can contain multiple sheets, each sheet has an array of rows.
 */
export interface WorkbookJSON {
  [sheetNumber: number]: WorkbookRow[];
}

export type Leaves<T> = { [K: string]: T | Leaves<T> } | { type: string };

export type FieldMappingConfigType = {
  [key: string]: Leaves<FieldConfigType> & {
    relationshipConfig: {
      type: string;
      hasGroup: boolean;
      baseApiPath: string;
    };
  };
};

export interface PrimitiveField {
  dataType:
    | WorkbookDataTypeEnum.NUMBER
    | WorkbookDataTypeEnum.BOOLEAN
    | WorkbookDataTypeEnum.STRING
    | WorkbookDataTypeEnum.DATE
    | WorkbookDataTypeEnum.STRING_ARRAY
    | WorkbookDataTypeEnum.NUMBER_ARRAY
    | WorkbookDataTypeEnum.BOOLEAN_ARRAY;
}

export interface ManagedAttributeField {
  dataType: WorkbookDataTypeEnum.MANAGED_ATTRIBUTES;
  managedAttributeComponent: string;
  endpoint: string;
}

export interface VocabularyField {
  dataType: WorkbookDataTypeEnum.VOCABULARY;
  endpoint: string;
}

export interface ObjectField {
  dataType: WorkbookDataTypeEnum.OBJECT | WorkbookDataTypeEnum.OBJECT_ARRAY;
  attributes: Leaves<FieldConfigType>;
  // If relationshipConfig is defined, the this field need to move to relationships.
  relationshipConfig?: {
    type: string;
    hasGroup: boolean;
    linkOrCreateSetting: LinkOrCreateSetting;
    baseApiPath?: string;
  };
}

export interface ClassificationType {
  dataType: WorkbookDataTypeEnum.CLASSIFICATION;
}

export type FieldConfigType =
  | PrimitiveField
  | VocabularyField
  | ManagedAttributeField
  | ObjectField
  | ClassificationType;

export type WorkbookResourceType = InputResource<
  KitsuResource & {
    group: string;
    relationships: {
      [key: string]: {
        data: { id: string; type: string } | { id: string; type: string }[];
      };
    };
  }
>;

export interface ColumnUniqueValues {
  [sheetIndex: number]: {
    [columnName: string]: {
      [value: string]: number;
    };
  };
}

export interface WorkbookColumnMap {
  [columnName: string]: // columnName in the spreadsheet
  {
    fieldPath?: string; // Mapped fieldPath in the configuration
    originalColumnName: string;
    showOnUI: boolean;
    mapRelationship: boolean; // If relationship mapping needed.
    numOfUniqueValues: number;
    valueMapping: {
      [value: string]:
        | {
            id: string;
            type: string;
          }
        | {
            key: string;
            name?: string;
          };
    };
  };
}

export interface RelationshipMapping {
  [columnHeader: string]: {
    [value: string]: {
      id: string;
      type: string;
    };
  };
}
