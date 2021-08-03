import { DinaForm, DinaFormOnSubmit, SubmitButton, TextField } from "common-ui";
import { FieldArray } from "formik";
import { useState } from "react";
import { DinaMessage } from "../../../../intl/dina-ui-intl";
import { useMetadataBuiltInAttributeColumns } from "../BulkMetadataEditor";
import {
  DefaultValueConfigManager,
  useStoredDefaultValuesConfigs
} from "./DefaultValueConfigManager";
import { DefaultValueRuleEditorRow } from "./DefaultValueRuleEditorRow";
import { DefaultValueRule, DefaultValuesConfig } from "./model-types";

export interface DefaultValueRuleEditorProps {
  initialIndex?: number | null;
  onSave?: (index: number | null) => void;
}

export function DefaultValueRuleEditor({
  initialIndex = 0,
  onSave
}: DefaultValueRuleEditorProps) {
  const builtInMetadataAttributes = useMetadataBuiltInAttributeColumns().filter(
    column => !column.readOnly && column.type !== "dropdown"
  );

  const { storedDefaultValuesConfigs, saveDefaultValuesConfigs } =
    useStoredDefaultValuesConfigs();

  const [ruleConfigIndex, setRuleConfigIndex] =
    useState<number | null>(initialIndex);

  const selectedConfig: DefaultValuesConfig | undefined =
    storedDefaultValuesConfigs[ruleConfigIndex ?? -1] ?? undefined;

  const saveDefaultValueRules: DinaFormOnSubmit<DefaultValuesConfig> = ({
    submittedValues
  }) => {
    const newDefaultValuesConfigs = [...storedDefaultValuesConfigs];

    if (selectedConfig) {
      newDefaultValuesConfigs[newDefaultValuesConfigs.indexOf(selectedConfig)] =
        submittedValues;
    } else {
      newDefaultValuesConfigs.push(submittedValues);
    }

    saveDefaultValuesConfigs(newDefaultValuesConfigs);

    onSave?.(ruleConfigIndex);
  };

  return (
    <div>
      <div className="mb-3">
        <DefaultValueConfigManager
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
              <ul className="list-group" style={{listStyleType:"none"}}>
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
                      <li>
                        <button
                          style={{ width: "10rem" }}
                          className="btn btn-primary add-rule-button"
                          type="button"
                          onClick={() => arrayHelpers.push(blankRule())}
                        >
                          <DinaMessage id="addRule" />
                        </button>
                      </li>
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

function blankRule(): DefaultValueRule {
  return {
    targetField: "",
    source: {
      type: "text",
      text: ""
    }
  };
}
