import { HotColumnProps } from "@handsontable/react";
import { useLocalStorage } from "@rehooks/local-storage";
import {
  DinaForm,
  DinaFormOnSubmit,
  SelectField,
  SubmitButton,
  TextField
} from "common-ui";
import { FieldArray, useFormikContext } from "formik";
import titleCase from "title-case";
import { v4 as uuidv4 } from "uuid";
import { useDinaIntl } from "../../../../intl/dina-ui-intl";
import { useMetadataBuiltInAttributeColumns } from "../BulkMetadataEditor";

interface DefaultValuesConfig {
  uuid: string;
  defaultValueRules: DefaultValueRule[];
}

interface DefaultValueRule {
  targetField: string;
  source: DefaultValueRuleSource;
}

type DefaultValueRuleSource = ObjectUploadFieldSource | TextLiteralSource;

interface ObjectUploadFieldSource {
  type: "objectUploadField";
  field: string;
}

interface TextLiteralSource {
  type: "text";
  text: string;
}

export interface DefaultValueRuleEditorProps {
  onSave?: () => void;
}

export function DefaultValueRuleEditor({
  onSave
}: DefaultValueRuleEditorProps) {
  const builtInMetadataAttributes = useMetadataBuiltInAttributeColumns().filter(
    column => !column.readOnly && column.type !== "dropdown"
  );

  const [
    storedDefaultValuesConfigs,
    saveDefaultValuesConfigs
  ] = useLocalStorage<DefaultValuesConfig[]>(
    "metadata_defaultValuesConfigs",
    []
  );

  const configToEdit = storedDefaultValuesConfigs[0] ?? {
    uuid: uuidv4(),
    defaultValueRules: []
  };

  const saveDefaultValueRules: DinaFormOnSubmit<DefaultValuesConfig> = ({
    submittedValues
  }) => {
    const index = storedDefaultValuesConfigs.findIndex(
      cfg => cfg.uuid === submittedValues.uuid
    );
    const newDefaultValuesConfigs = [...storedDefaultValuesConfigs];

    if (index === -1) {
      newDefaultValuesConfigs.push(submittedValues);
    } else {
      newDefaultValuesConfigs[index] = submittedValues;
    }

    saveDefaultValuesConfigs(newDefaultValuesConfigs);

    onSave?.();
  };

  return (
    <DinaForm<DefaultValuesConfig>
      initialValues={configToEdit}
      onSubmit={saveDefaultValueRules}
    >
      {({ values }) => (
        <div>
          <ul className="list-group">
            <FieldArray name="defaultValueRules">
              {arrayHelpers =>
                values.defaultValueRules.length ? (
                  values.defaultValueRules.map((_, index) => (
                    <li className="list-group-item" key={index}>
                      <DefaultValueRuleEditorRow
                        index={index}
                        onAddClick={() =>
                          arrayHelpers.insert(index + 1, blankRule())
                        }
                        onRemoveClick={() => arrayHelpers.remove(index)}
                        targetFields={builtInMetadataAttributes}
                      />
                    </li>
                  ))
                ) : (
                  <button
                    style={{ width: "10rem" }}
                    className="btn btn-primary"
                    type="button"
                    onClick={() => arrayHelpers.push(blankRule())}
                  >
                    Add rule
                  </button>
                )
              }
            </FieldArray>
          </ul>
          {/** Spacer div to make room for react-select's dropdown menus: */}
          <div style={{ height: "15rem" }} />
          <SubmitButton />
        </div>
      )}
    </DinaForm>
  );
}

interface DefaultValueRuleEditorRowProps {
  index: number;
  targetFields: HotColumnProps[];
  onAddClick: () => void;
  onRemoveClick: () => void;
}

function DefaultValueRuleEditorRow({
  index,
  targetFields,
  onAddClick,
  onRemoveClick
}: DefaultValueRuleEditorRowProps) {
  const { values } = useFormikContext<DefaultValuesConfig>();
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

  const rule = values.defaultValueRules[index];

  const fieldPrefix = `defaultValueRules.${index}`;

  return (
    <div className="list-inline">
      <div className="list-inline-item">Set</div>
      <div className="list-inline-item" style={{ width: "16rem" }}>
        <SelectField
          name={`${fieldPrefix}.targetField`}
          options={targetFieldOptions}
          label={formatMessage("targetField")}
        />
      </div>
      <div className="list-inline-item">To</div>
      <div className="list-inline-item" style={{ width: "16rem" }}>
        <SelectField
          name={`${fieldPrefix}.source.type`}
          options={sourceTypeOptions}
          label={formatMessage("valueSourceType")}
        />
      </div>
      <div className="list-inline-item">:</div>
      {rule.source.type === "text" && (
        <div className="list-inline-item" style={{ width: "16rem" }}>
          <TextField
            name={`${fieldPrefix}.source.text`}
            label={formatMessage("sourceText")}
          />
        </div>
      )}
      {rule.source.type === "objectUploadField" && (
        <div className="list-inline-item" style={{ width: "16rem" }}>
          <SelectField
            name={`${fieldPrefix}.source.field`}
            options={objectUploadFieldOptions}
            label={formatMessage("sourceField")}
          />
        </div>
      )}
      <div className="list-inline-item">
        <button className="btn btn-primary" type="button" onClick={onAddClick}>
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

function blankRule(): DefaultValueRule {
  return {
    targetField: "",
    source: {
      type: "text",
      text: ""
    }
  };
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
