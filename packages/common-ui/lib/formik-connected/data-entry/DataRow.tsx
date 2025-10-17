import {
  CheckBoxField,
  CreatableSelectField,
  DateField,
  FieldSpy,
  NumberField,
  ConceptUrlField,
  SelectField,
  StringToggleField,
  TextField,
  Tooltip
} from "common-ui";
import { useFormikContext } from "formik";
import _ from "lodash";
import { FaMinus, FaPlus } from "react-icons/fa";
import {
  DinaMessage,
  useDinaIntl
} from "../../../../dina-ui/intl/dina-ui-intl";
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
  showPlusIcon?: boolean;
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
  showPlusIcon,
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
  function addRow() {
    const newRows = {
      ...currentRows,
      [`extensionField-${Object.keys(currentRows).length}`]: ""
    };
    formik.setFieldValue(rowsPath, newRows);
  }
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
    label: <DinaMessage id="dataValue" />,
    disableTemplateCheckbox: true,
    hideLabel: rowIndex !== 0,
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
    ) : selectedType?.vocabularyElementType === "CONCEPTURL" ? (
      <ConceptUrlField
        {...valueInputProps}
        conceptQueryEndpoint={selectedType?.conceptQueryEndpoint}
        topLevelConcept={selectedType?.topLevelConcept}
      />
    ) : (
      <TextField {...valueInputProps} />
    );

  return (
    <div className="d-flex">
      <div style={{ width: "15rem" }}>
        {typesAddable ? (
          <CreatableSelectField
            options={typeOptions}
            name={typeSelectFieldName}
            label={<DinaMessage id="dataType" />}
            removeBottomMargin={true}
            disableTemplateCheckbox={true}
            onChange={onCreatableSelectFieldChange}
            hideLabel={rowIndex !== 0}
            readOnlyBold={true}
          />
        ) : (
          <div className="d-flex flex-row align-items-center">
            <div style={{ width: "15rem" }}>
              <SelectField
                options={typeOptions}
                name={typeSelectFieldName}
                label={<DinaMessage id="dataType" />}
                removeBottomMargin={true}
                disableTemplateCheckbox={true}
                hideLabel={rowIndex !== 0}
                readOnlyBold={true}
                onChange={onTypeSelectFieldChange}
              />
            </div>

            <FieldSpy fieldName={typeSelectFieldName}>
              {(value) => (
                <>
                  {value && typeOptions ? (
                    <div
                      style={{
                        marginTop: rowIndex === 0 ? "1.4rem" : "0rem"
                      }}
                    >
                      <Tooltip
                        directText={
                          _.find(
                            typeOptions,
                            (item) => item.value === value
                          )?.descriptions?.find((desc) => desc.lang === locale)
                            ?.desc
                        }
                        placement={"right"}
                      />
                    </div>
                  ) : (
                    <></>
                  )}
                </>
              )}
            </FieldSpy>
          </div>
        )}
      </div>
      <div style={{ width: "15rem", marginLeft: "3rem" }}>
        {valueInputField}
      </div>
      {unitsOptions ? (
        <div style={{ width: "15rem", marginLeft: "3rem" }}>
          {unitsAddable ? (
            <CreatableSelectField
              options={unitsOptions}
              name={unitSelectFieldName}
              removeBottomMargin={true}
              label={<DinaMessage id="dataUnit" />}
              disableTemplateCheckbox={true}
              hideLabel={rowIndex !== 0}
            />
          ) : (
            <SelectField
              options={unitsOptions}
              name={unitSelectFieldName}
              removeBottomMargin={true}
              label={<DinaMessage id="dataUnit" />}
              disableTemplateCheckbox={true}
              hideLabel={rowIndex !== 0}
            />
          )}
        </div>
      ) : (
        <div style={{ width: "15rem", marginLeft: "3rem" }}>
          <TextField
            name={unitSelectFieldName}
            removeBottomMargin={true}
            label={<DinaMessage id="dataUnit" />}
            disableTemplateCheckbox={true}
            hideLabel={rowIndex !== 0}
            readOnly={true}
            placeholder={selectedType?.unit ?? ""}
            disableClearButton={disableClearButton}
          />
        </div>
      )}
      {isVocabularyBasedEnabledForType && (
        <CheckBoxField
          className="hidden"
          name={vocabularyBasedFieldName}
          removeLabel={true}
        />
      )}
      {!readOnly && (
        <div
          style={{
            cursor: "pointer",
            marginTop: rowIndex === 0 ? "2rem" : "0.6rem"
          }}
        >
          {rowIndex === 0 && showPlusIcon ? (
            <>
              {
                <FaPlus
                  className="ms-1"
                  onClick={addRow}
                  size="2em"
                  name={getFieldName(name, "addRow", rowIndex)}
                  onMouseOver={(event) =>
                    (event.currentTarget.style.color = "blue")
                  }
                  onMouseOut={(event) => (event.currentTarget.style.color = "")}
                  data-testid="add row button"
                />
              }
            </>
          ) : (
            <FaMinus
              className="ms-1"
              onClick={removeRow}
              size="2em"
              name={getFieldName(name, "removeRow", rowIndex)}
              onMouseOver={(event) =>
                (event.currentTarget.style.color = "blue")
              }
              onMouseOut={(event) => (event.currentTarget.style.color = "")}
            />
          )}
        </div>
      )}
    </div>
  );
}
