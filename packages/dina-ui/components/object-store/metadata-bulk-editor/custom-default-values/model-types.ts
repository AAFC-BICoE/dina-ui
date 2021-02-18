export interface DefaultValuesConfig {
  createdOn: string;
  name: string;
  defaultValueRules: DefaultValueRule[];
}
export interface DefaultValueRule {
  targetField: string;
  source: DefaultValueRuleSource;
}

export type DefaultValueRuleSource =
  | ObjectUploadFieldSource
  | TextLiteralSource;

export interface ObjectUploadFieldSource {
  type: "objectUploadField";
  field: string;
}

export interface TextLiteralSource {
  type: "text";
  text: string;
}
