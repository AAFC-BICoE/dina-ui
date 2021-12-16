import { useLocalStorage } from "@rehooks/local-storage";
import { FieldWrapper, FieldWrapperProps, SelectOption } from "common-ui";
import Select, { StylesConfig } from "react-select";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";
import { DefaultValuesConfig } from "./model-types";

export interface DefaultValueConfigSelectProps {
  allowBlank?: boolean;
  ruleConfigIndex: number | null;
  onChangeConfigIndex: (index: number | null) => void;
  /** Mock this out in tests so it gives a predictable value. */
  dateSupplier?: () => string;
  styles?: Partial<StylesConfig<SelectOption<any>, boolean>>;
}

/** Lists, adds, edits, and removes Default Value Configs. */
export function DefaultValueConfigManager({
  allowBlank,
  ruleConfigIndex,
  onChangeConfigIndex,
  dateSupplier = () => new Date().toLocaleString()
}: DefaultValueConfigSelectProps) {
  const { storedDefaultValuesConfigs, saveDefaultValuesConfigs } =
    useStoredDefaultValuesConfigs();

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
    <div className="list-inline">
      <div className="list-inline-item">
        <strong>
          <DinaMessage id="defaultValuesConfig" />:
        </strong>
      </div>
      <div className="list-inline-item" style={{ width: "24rem" }}>
        <DefaultValuesConfigSelect
          allowBlank={allowBlank}
          onChangeConfigIndex={onChangeConfigIndex}
          ruleConfigIndex={ruleConfigIndex}
        />
      </div>
      <div className="list-inline-item">
        <button
          type="button"
          className="btn btn-primary form-control add-button"
          onClick={addNewConfig}
        >
          <DinaMessage id="addRuleSet" />
        </button>
      </div>
      <div className="list-inline-item">
        <button
          type="button"
          className="btn btn-danger form-control delete-button"
          onClick={deleteThisConfig}
        >
          <DinaMessage id="deleteConfig" />
        </button>
      </div>
    </div>
  );
}

export function useStoredDefaultValuesConfigs() {
  const [storedDefaultValuesConfigs, saveDefaultValuesConfigs] =
    useLocalStorage<DefaultValuesConfig[]>("metadata_defaultValuesConfigs", []);

  return { storedDefaultValuesConfigs, saveDefaultValuesConfigs };
}

/** Select menu for stored DefaultValuesConfig. */
export function DefaultValuesConfigSelect({
  onChangeConfigIndex,
  ruleConfigIndex,
  allowBlank,
  styles
}: DefaultValueConfigSelectProps) {
  const { storedDefaultValuesConfigs } = useStoredDefaultValuesConfigs();
  const { formatMessage } = useDinaIntl();

  const ruleConfigOptions = storedDefaultValuesConfigs.map((cfg, index) => ({
    label: cfg.name || `Rule Set ${cfg.createdOn}`,
    value: index
  }));

  const selectOptions = allowBlank
    ? [{ label: "<none>", value: null }, ...ruleConfigOptions]
    : ruleConfigOptions;

  return (
    <Select<{ label: string; value: number | null }>
      instanceId={
        "config-select-" +
        document.getElementsByClassName("ReactModalPortal").length
      }
      aria-label={formatMessage("selectRuleSet")}
      options={selectOptions}
      onChange={(option: any) => onChangeConfigIndex(option.value)}
      value={ruleConfigOptions[ruleConfigIndex ?? -1] ?? null}
      styles={styles}
    />
  );
}

/** Formik-connected DefaultValuesConfig Select Field. */
export function DefaultValuesConfigSelectField(
  props: FieldWrapperProps & {
    allowBlank?: boolean;
    styles?: Partial<StylesConfig<SelectOption<any>, boolean>>;
  }
) {
  const { allowBlank, styles, ...labelWrapperProps } = props;

  return (
    <FieldWrapper {...labelWrapperProps}>
      {({ setValue, value }) => (
        <DefaultValuesConfigSelect
          allowBlank={allowBlank}
          onChangeConfigIndex={setValue}
          ruleConfigIndex={value}
          styles={styles}
        />
      )}
    </FieldWrapper>
  );
}
