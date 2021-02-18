import { HotColumnProps } from "@handsontable/react";
import { SelectField, TextField } from "common-ui";
import { useFormikContext } from "formik";
import titleCase from "title-case";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";
import { DefaultValueRule, DefaultValuesConfig } from "./model-types";

export interface DefaultValueRuleEditorRowProps {
  index: number;
  rule: DefaultValueRule;
  targetFields: HotColumnProps[];
  onAddClick: () => void;
  onRemoveClick: () => void;
}

export function DefaultValueRuleEditorRow({
  index,
  rule,
  targetFields,
  onAddClick,
  onRemoveClick
}: DefaultValueRuleEditorRowProps) {
  const { setFieldValue } = useFormikContext<DefaultValuesConfig>();
  const { formatMessage } = useDinaIntl();

  const targetFieldOptions = targetFields.map(({ title, data }) => ({
    label: String(title),
    value: data
  }));

  const sourceTypeOptions = ["text", "objectUploadField"].map(sourceType => ({
    label: formatMessage(sourceType as any).trim() || titleCase(sourceType),
    value: sourceType
  }));

  const objectUploadFieldOptions = OBJECT_UPLOAD_FIELDS.map(field => ({
    label: formatMessage(`field_${field}` as any).trim() || titleCase(field),
    value: field
  }));

  const fieldPrefix = `defaultValueRules.${index}`;

  /** Gets rid of fields from the previous Field Source object. */
  function clearSourceField(type: string) {
    setFieldValue(`${fieldPrefix}.source`, { type });
  }

  return (
    <div className="list-inline">
      <div className="list-inline-item">
        <DinaMessage id="set" />
      </div>
      <div
        className="list-inline-item target-field-field"
        style={{ width: "16rem" }}
      >
        <SelectField
          name={`${fieldPrefix}.targetField`}
          options={targetFieldOptions}
          label={formatMessage("targetField")}
        />
      </div>
      <div className="list-inline-item">
        <DinaMessage id="to" />
      </div>
      <div
        className="list-inline-item source-type-field"
        style={{ width: "16rem" }}
      >
        <SelectField
          name={`${fieldPrefix}.source.type`}
          options={sourceTypeOptions}
          label={formatMessage("valueSourceType")}
          onChange={clearSourceField}
        />
      </div>
      <div className="list-inline-item">:</div>
      {rule.source.type === "text" && (
        <div
          className="list-inline-item source-text-field"
          style={{ width: "16rem" }}
        >
          <TextField
            name={`${fieldPrefix}.source.text`}
            label={formatMessage("sourceText")}
          />
        </div>
      )}
      {rule.source.type === "objectUploadField" && (
        <div
          className="list-inline-item source-field-field"
          style={{ width: "16rem" }}
        >
          <SelectField
            name={`${fieldPrefix}.source.field`}
            options={objectUploadFieldOptions}
            label={formatMessage("sourceField")}
          />
        </div>
      )}
      <div className="list-inline-item">
        <button
          className="btn btn-primary add-rule-button"
          type="button"
          onClick={onAddClick}
        >
          +
        </button>
      </div>
      <div className="list-inline-item">
        <button
          className="btn btn-primary"
          type="button"
          onClick={onRemoveClick}
        >
          -
        </button>
      </div>
    </div>
  );
}

const OBJECT_UPLOAD_FIELDS = [
  "bucket",
  "createdBy",
  "createdOn",
  "dateTimeDigitized",
  "dcType",
  "detectedFileExtension",
  "detectedMediaType",
  "evaluatedFileExtension",
  "evaluatedMediaType",
  "originalFilename",
  "receivedMediaType",
  "sha1Hex",
  "sizeInBytes",
  "thumbnailIdentifier"
];
