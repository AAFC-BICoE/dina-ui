import { useLocalStorage } from "@rehooks/local-storage";
import { FieldWrapper, LabelWrapperParams } from "common-ui";
import { FastField, FieldProps } from "formik";
import Select from "react-select";
import { DefaultValuesConfig } from "./model-types";

export interface DefaultValueConfigSelectProps {
  allowBlank?: boolean;
  ruleConfigIndex: number | null;
  onChangeConfigIndex: (index: number | null) => void;
  /** Mock this out in tests so it gives a predictable value. */
  dateSupplier?: () => string;
}

/** Lists, adds, edits, and removes Default Value Configs. */
export function DefaultValueConfigManager({
  allowBlank,
  ruleConfigIndex,
  onChangeConfigIndex,
  dateSupplier = () => new Date().toLocaleString()
}: DefaultValueConfigSelectProps) {
  const {
    storedDefaultValuesConfigs,
    saveDefaultValuesConfigs
  } = useStoredDefaultValuesConfigs();

  function addNewConfig() {
    const newConfigs = [
      ...storedDefaultValuesConfigs,
      {
        name: "",
        createdOn: dateSupplier(),
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

  return (
    <div className="row">
      <div className="col-md-4">
        <DefaultValuesConfigSelect
          allowBlank={allowBlank}
          onChangeConfigIndex={onChangeConfigIndex}
          ruleConfigIndex={ruleConfigIndex}
        />
      </div>
      <div className="col-md-2">
        <button
          type="button"
          className="btn btn-primary form-control add-button"
          onClick={addNewConfig}
        >
          Add Rule Set
        </button>
      </div>
      <div className="col-md-2">
        <button
          type="button"
          className="btn btn-danger form-control delete-button"
          onClick={deleteThisConfig}
        >
          Delete Config
        </button>
      </div>
    </div>
  );
}

export function useStoredDefaultValuesConfigs() {
  const [
    storedDefaultValuesConfigs,
    saveDefaultValuesConfigs
  ] = useLocalStorage<DefaultValuesConfig[]>(
    "metadata_defaultValuesConfigs",
    []
  );

  return { storedDefaultValuesConfigs, saveDefaultValuesConfigs };
}

/** Select menu for stored DefaultValuesConfig. */
export function DefaultValuesConfigSelect({
  onChangeConfigIndex,
  ruleConfigIndex,
  allowBlank
}: DefaultValueConfigSelectProps) {
  const { storedDefaultValuesConfigs } = useStoredDefaultValuesConfigs();

  const ruleConfigOptions = storedDefaultValuesConfigs.map((cfg, index) => ({
    label: cfg.name || `Rule Set ${cfg.createdOn}`,
    value: index
  }));

  const selectOptions = allowBlank
    ? [{ label: "<none>", value: null }, ...ruleConfigOptions]
    : ruleConfigOptions;

  return (
    <Select<{ label: string; value: number | null }>
      instanceId="config-select"
      options={selectOptions}
      onChange={(option: any) => onChangeConfigIndex(option.value)}
      value={ruleConfigOptions[ruleConfigIndex ?? -1] ?? null}
    />
  );
}

/** Formik-connected DefaultValuesConfig Select Field. */
export function DefaultValuesConfigSelectField(
  props: LabelWrapperParams & { allowBlank?: boolean }
) {
  const { allowBlank, ...labelWrapperProps } = props;
  return (
    <FastField name={props.name}>
      {({ field: { value }, form: { setFieldValue } }: FieldProps) => {
        return (
          <FieldWrapper {...labelWrapperProps}>
            <DefaultValuesConfigSelect
              allowBlank={allowBlank}
              onChangeConfigIndex={newIndex =>
                setFieldValue(props.name, newIndex)
              }
              ruleConfigIndex={value}
            />
          </FieldWrapper>
        );
      }}
    </FastField>
  );
}
