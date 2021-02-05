import { HotColumnProps } from "@handsontable/react";
import { useLocalStorage } from "@rehooks/local-storage";
import {
  DinaForm,
  DinaFormOnSubmit,
  SelectField,
  SubmitButton,
  TextField
} from "common-ui";
import { FieldArray } from "formik";
import { useEffect, useState } from "react";
import Select from "react-select";
import titleCase from "title-case";
import { useDinaIntl } from "../../../../intl/dina-ui-intl";
import { useMetadataBuiltInAttributeColumns } from "../BulkMetadataEditor";

interface DefaultValuesConfig {
  createdOn: string;
  name: string;
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

  const [ruleConfigIndex, setRuleConfigIndex] = useState(0);

  const selectedConfig: DefaultValuesConfig | undefined =
    storedDefaultValuesConfigs[ruleConfigIndex];

  const saveDefaultValueRules: DinaFormOnSubmit<DefaultValuesConfig> = ({
    submittedValues
  }) => {
    const newDefaultValuesConfigs = [...storedDefaultValuesConfigs];

    const existingRuleConfig = newDefaultValuesConfigs[ruleConfigIndex];

    if (existingRuleConfig) {
      newDefaultValuesConfigs[ruleConfigIndex] = submittedValues;
    } else {
      newDefaultValuesConfigs.push(submittedValues);
    }

    saveDefaultValuesConfigs(newDefaultValuesConfigs);

    onSave?.();
  };

  return (
    <div>
      <div className="form-group">
        <DefaultValueConfigSelector
          ruleConfigIndex={ruleConfigIndex}
          onChangeConfigIndex={setRuleConfigIndex}
        />
      </div>
      <hr />
      {selectedConfig && (
        <DinaForm<DefaultValuesConfig>
          enableReinitialize={true}
          initialValues={selectedConfig}
          onSubmit={saveDefaultValueRules}
        >
          {({ values }) => (
            <div>
              <TextField className="col-md-3" name="name" />
              <ul className="list-group">
                <FieldArray name="defaultValueRules">
                  {arrayHelpers =>
                    values.defaultValueRules.length ? (
                      values.defaultValueRules.map((rule, index) => (
                        <li className="list-group-item" key={index}>
                          <DefaultValueRuleEditorRow
                            index={index}
                            rule={rule}
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
      )}
    </div>
  );
}

interface DefaultValueConfigSelectorProps {
  ruleConfigIndex: number;
  onChangeConfigIndex: (index: number) => void;
}

function DefaultValueConfigSelector({
  ruleConfigIndex,
  onChangeConfigIndex
}: DefaultValueConfigSelectorProps) {
  const [
    storedDefaultValuesConfigs,
    saveDefaultValuesConfigs
  ] = useLocalStorage<DefaultValuesConfig[]>(
    "metadata_defaultValuesConfigs",
    []
  );

  function addNewConfig() {
    const newConfigs = [
      ...storedDefaultValuesConfigs,
      {
        name: "",
        createdOn: new Date().toLocaleString(),
        defaultValueRules: []
      }
    ];
    saveDefaultValuesConfigs(newConfigs);
    onChangeConfigIndex(newConfigs.length - 1);
  }

  function deleteThisConfig() {
    const newConfigs = storedDefaultValuesConfigs.filter(
      (_, index) => index !== ruleConfigIndex
    );
    saveDefaultValuesConfigs(newConfigs);
    onChangeConfigIndex(0);
  }

  const ruleConfigSelectOptions = storedDefaultValuesConfigs.map(
    (cfg, index) => ({
      label: cfg.name || `Rule Set ${cfg.createdOn}`,
      value: index
    })
  );

  return (
    <div className="row">
      <div className="col-md-4">
        <Select<{ label: string; value: number }>
          instanceId="config-select"
          options={ruleConfigSelectOptions}
          onChange={(option: any) => onChangeConfigIndex(option.value)}
          value={ruleConfigSelectOptions[ruleConfigIndex] ?? null}
        />
      </div>
      <div className="col-md-2">
        <button
          type="button"
          className="btn btn-primary"
          onClick={addNewConfig}
        >
          Add Rule Set
        </button>
      </div>
      <div className="col-md-2">
        <button
          type="button"
          className="btn btn-danger"
          onClick={deleteThisConfig}
        >
          Delete this Rule Set
        </button>
      </div>
    </div>
  );
}

interface DefaultValueRuleEditorRowProps {
  index: number;
  rule: DefaultValueRule;
  targetFields: HotColumnProps[];
  onAddClick: () => void;
  onRemoveClick: () => void;
}

function DefaultValueRuleEditorRow({
  index,
  rule,
  targetFields,
  onAddClick,
  onRemoveClick
}: DefaultValueRuleEditorRowProps) {
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
