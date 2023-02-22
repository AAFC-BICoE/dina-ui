import {
  CheckBoxField,
  CreatableSelectField,
  SelectField,
  TextField
} from "common-ui";
import { find } from "lodash";
import { FaMinus, FaPlus } from "react-icons/fa";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";

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
  addRow?: () => void;
  removeRow?: (index) => void;
  /** The model type to select resources from. */
  model?: string;
  unitsOptions?: any[];
  typeOptions?: any[];
  readOnly?: boolean;
  unitsAddable?: boolean;
  typesAddable?: boolean;
  isVocabularyBasedEnabledForType?: boolean;
}

export function DataRow({
  rowIndex,
  addRow,
  removeRow,
  name,
  showPlusIcon,
  unitsOptions,
  typeOptions,
  readOnly,
  typesAddable = false,
  unitsAddable = false,
  isVocabularyBasedEnabledForType = false
}: DataRowProps) {
  const valueTextFieldName = `${name}.value`;
  const typeSelectFieldName = `${name}.type`;
  const unitSelectFieldName = `${name}.unit`;
  const vocabularyBasedFieldName = `${name}.vocabularyBased`;

  function onCreatableSelectFieldChange(value, formik) {
    if (isVocabularyBasedEnabledForType) {
      formik.setFieldValue(
        vocabularyBasedFieldName,
        !!find(typeOptions, (item) => item.value === value)
      );
    }
  }

  return (
    <div className="d-flex">
      {typeOptions && (
        <div style={{ width: "15rem", marginLeft: "17rem" }}>
          {typesAddable ? (
            <CreatableSelectField
              options={typeOptions}
              name={typeSelectFieldName}
              label={<DinaMessage id="dataType" />}
              removeBottomMargin={true}
              disableTemplateCheckbox={true}
              onChange={onCreatableSelectFieldChange}
            />
          ) : (
            <SelectField
              options={typeOptions}
              name={typeSelectFieldName}
              label={<DinaMessage id="dataType" />}
              removeBottomMargin={true}
              disableTemplateCheckbox={true}
            />
          )}
        </div>
      )}
      <div style={{ width: "15rem", marginLeft: "3rem" }}>
        <TextField
          name={valueTextFieldName}
          removeBottomMargin={true}
          label={<DinaMessage id="dataValue" />}
          disableTemplateCheckbox={true}
        />
      </div>
      {unitsOptions && (
        <div style={{ width: "15rem", marginLeft: "3rem" }}>
          {unitsAddable ? (
            <CreatableSelectField
              options={unitsOptions}
              name={unitSelectFieldName}
              removeBottomMargin={true}
              label={<DinaMessage id="unit" />}
              disableTemplateCheckbox={true}
            />
          ) : (
            <SelectField
              options={unitsOptions}
              name={unitSelectFieldName}
              removeBottomMargin={true}
              label={<DinaMessage id="unit" />}
              disableTemplateCheckbox={true}
            />
          )}
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
        <div style={{ cursor: "pointer", marginTop: "2rem" }}>
          {rowIndex === 0 && showPlusIcon ? (
            <>
              {
                <FaPlus
                  className="ms-1"
                  onClick={addRow as any}
                  size="2em"
                  name={getFieldName(name, "addRow", rowIndex)}
                />
              }
            </>
          ) : (
            <FaMinus
              className="ms-1"
              onClick={() => removeRow?.(rowIndex)}
              size="2em"
              name={getFieldName(name, "removeRow", rowIndex)}
            />
          )}
        </div>
      )}
    </div>
  );
}
