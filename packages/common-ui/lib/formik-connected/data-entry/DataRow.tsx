import {
  CheckBoxField,
  CreatableSelectField,
  DateField,
  FieldSpy,
  NumberField,
  SelectField,
  StringToggleField,
  TextField,
  Tooltip
} from "common-ui";
import { useFormikContext } from "formik";
import _ from "lodash";
import { DinaMessage, useDinaIntl } from "@dina-ui/intl/dina-ui-intl";
import { useEffect, useState } from "react";

export function getFieldName(
  fieldArrayName: string,
  fieldName: string,
  index: number
) {
  return `${fieldArrayName}[${index}].${fieldName}`;
}

export interface DataRowProps {
  name: string;
  rowIndex: number;
  /** Types already used by other rows in the same block, hidden from the type options. */
  usedTypes?: string[];
  unitsOptions?: any[];
  typeOptions?: any[];
  readOnly?: boolean;
  unitsAddable?: boolean;
  typesAddable?: boolean;
  isVocabularyBasedEnabledForType?: boolean;
  disableClearButton?: boolean;
}

export function DataRow({
  rowIndex,
  name,
  usedTypes,
  unitsOptions,
  typeOptions,
  readOnly,
  typesAddable = false,
  unitsAddable = false,
  isVocabularyBasedEnabledForType = false,
  disableClearButton = false
}: DataRowProps) {
  const { locale, messages } = useDinaIntl();
  const valueTextFieldName = `${name}.value`;
  const typeSelectFieldName = `${name}.type`;
  const unitSelectFieldName = `${name}.unit`;

  const vocabularyBasedFieldName = `${name}.vocabularyBased`;
  const formik = useFormikContext<any>();

  const [selectedType, setSelectedType] = useState<any>();

  function onCreatableSelectFieldChange(value, formikCtx) {
    if (isVocabularyBasedEnabledForType) {
      formikCtx.setFieldValue(
        vocabularyBasedFieldName,
        !!_.find(typeOptions, (item) => item.value === value)
      );
    }
  }

  // Change currentSelectedType and unit if the name (formik path) changes
  useEffect(() => {
    const selectedTypeValue = name.split(".").at(-1);
    const selected = typeOptions?.find(
      (typeOption) => typeOption.value === selectedTypeValue
    );
    setSelectedType(selected);
  }, [name]);

  function onTypeSelectFieldChange(value) {
    setSelectedType(_.find(typeOptions, (item) => item.value === value));
  }

  // Load initial values
  useEffect(() => {
    if (readOnly && typeOptions?.length) {
      typeOptions.forEach((typeOption) => {
        if (unitSelectFieldName.includes(typeOption.value)) {
          formik.setFieldValue(unitSelectFieldName, typeOption.unit);
        }
      });
    }
  }, [typeOptions]);

  const rowsPath = name.substring(0, name.lastIndexOf("."));
  const currentRows = _.get(formik.values, rowsPath);
  function removeRow() {
    const rowName = name.split(".").at(-1);
    if (rowName) {
      const { [rowName]: _, ...newRows } = currentRows;
      formik.setFieldValue(rowsPath, newRows);
    }
  }

  const valueInputProps = {
    name: valueTextFieldName,
    removeBottomMargin: true,
    removeLabel: true,
    disableTemplateCheckbox: true,
    disableClearButton: disableClearButton
  };

  const valueInputField =
    selectedType?.vocabularyElementType === "INTEGER" ? (
      <NumberField
        {...valueInputProps}
        placeholder={messages["placeholder_integer"]}
      />
    ) : selectedType?.vocabularyElementType === "DATE" ? (
      <DateField {...valueInputProps} />
    ) : selectedType?.vocabularyElementType === "BOOL" ? (
      <StringToggleField {...valueInputProps} />
    ) : selectedType?.vocabularyElementType === "DECIMAL" ? (
      <NumberField {...valueInputProps} isInteger={false} />
    ) : (
      <TextField {...valueInputProps} />
    );

  const labelProps = {
    removeBottomMargin: true,
    removeLabel: true,
    disableTemplateCheckbox: true
  };

  return (
    <div className="data-entry-grid mb-2">
      <div className="d-flex align-items-center gap-2">
        <div className="flex-grow-1">
          {typesAddable ? (
            <CreatableSelectField
              {...labelProps}
              options={typeOptions}
              name={typeSelectFieldName}
              onChange={onCreatableSelectFieldChange}
              filterValues={usedTypes}
              readOnlyBold={true}
            />
          ) : (
            <SelectField
              {...labelProps}
              options={typeOptions}
              name={typeSelectFieldName}
              filterValues={usedTypes}
              readOnlyBold={true}
              onChange={onTypeSelectFieldChange}
            />
          )}
        </div>
        {!typesAddable && (
          <FieldSpy fieldName={typeSelectFieldName}>
            {(value) =>
              value && typeOptions ? (
                <Tooltip
                  directText={
                    _.find(
                      typeOptions,
                      (item) => item.value === value
                    )?.descriptions?.find((desc) => desc.lang === locale)?.desc
                  }
                  placement={"right"}
                  disableSpanMargin={true}
                />
              ) : null
            }
          </FieldSpy>
        )}
      </div>
      <div>{valueInputField}</div>
      <div>
        {unitsOptions ? (
          unitsAddable ? (
            <CreatableSelectField
              {...labelProps}
              options={unitsOptions}
              name={unitSelectFieldName}
            />
          ) : (
            <SelectField
              {...labelProps}
              options={unitsOptions}
              name={unitSelectFieldName}
            />
          )
        ) : (
          // Field extension types have one fixed unit, shown here but not editable.
          <TextField
            {...labelProps}
            name={unitSelectFieldName}
            disabled={true}
            placeholder={selectedType?.unit ?? ""}
            disableClearButton={disableClearButton}
          />
        )}
      </div>
      <div>
        {isVocabularyBasedEnabledForType && (
          <CheckBoxField
            className="hidden"
            name={vocabularyBasedFieldName}
            removeLabel={true}
          />
        )}
        {!readOnly && (
          <button
            type="button"
            className="btn btn-link p-0 data-entry-remove"
            onClick={removeRow}
            name={getFieldName(name, "removeRow", rowIndex)}
          >
            <DinaMessage id="remove" />
          </button>
        )}
      </div>
    </div>
  );
}
