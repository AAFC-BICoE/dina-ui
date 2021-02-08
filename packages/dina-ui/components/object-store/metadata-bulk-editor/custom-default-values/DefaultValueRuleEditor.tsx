import { useLocalStorage } from "@rehooks/local-storage";
import { DinaForm, DinaFormOnSubmit, SubmitButton, TextField } from "common-ui";
import { FieldArray } from "formik";
import { useState } from "react";
import Select from "react-select";
import { useMetadataBuiltInAttributeColumns } from "../BulkMetadataEditor";
import { DefaultValueRuleEditorRow } from "./DefaultValueRuleEditorRow";
import { DefaultValueRule, DefaultValuesConfig } from "./model-types";

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

function blankRule(): DefaultValueRule {
  return {
    targetField: "",
    source: {
      type: "text",
      text: ""
    }
  };
}
