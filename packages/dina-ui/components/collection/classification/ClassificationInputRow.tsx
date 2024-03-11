import {
  CheckBoxField,
  CreatableSelectField,
  FieldSpy,
  SelectField,
  TextField,
  Tooltip
} from "common-ui";
import { useFormikContext } from "formik";
import { find, get } from "lodash";
import { FaMinus, FaPlus } from "react-icons/fa";
import {
  DinaMessage,
  useDinaIntl
} from "../../../intl/dina-ui-intl";
import { useEffect, useState } from "react";
import { VocabularySelectField } from "../VocabularySelectField";

export function getFieldName(
  fieldArrayName: string,
  fieldName: string,
  index: number
) {
  return `${fieldArrayName}[${index}].${fieldName}`;
}

export interface ClassificationInputRowProps {
  name: string;
  rowIndex: number;
  showPlusIcon?: boolean;
  readOnly?: boolean;
  prevRank?: string;
}

export function ClassificationInputRow({
  rowIndex,
  name,
  showPlusIcon,
  readOnly,
  prevRank
}: ClassificationInputRowProps) {
  const { locale } = useDinaIntl();
  const classificationRanksFieldName = `${name}.classificationRanks`;
  const classificationPathFieldName = `${name}.classificationPath`;
  const formik = useFormikContext<any>();

  const [selectedType, setSelectedType] = useState<any>();

  function onCreatableSelectFieldChange(value, formikCtx) {
    // if (isVocabularyBasedEnabledForType) {
    //   formikCtx.setFieldValue(
    //     vocabularyBasedFieldName,
    //     !!find(typeOptions, (item) => item.value === value)
    //   );
    // }
  }

  function onTypeSelectFieldChange(value) {
    // setSelectedType(find(typeOptions, (item) => item.value === value));
  }

  const rowsPath = name.substring(0, name.lastIndexOf("."));
  const currentRows = get(formik.values, rowsPath);
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

  return (
    <div className="d-flex">
      <div style={{ width: "15rem" }}>
        <VocabularySelectField
          name={`taxonomicRank`}
          path="collection-api/vocabulary/taxonomicRank"
          hideLabel={true}
        />
      </div>
      <div style={{ width: "15rem", marginLeft: "1rem" }}>
        <TextField
          name={classificationPathFieldName}
          removeBottomMargin={true}
          label={<DinaMessage id="dataValue" />}
          disableTemplateCheckbox={true}
          hideLabel={true}
        />
      </div>
      {!readOnly && (
        <div
          style={{
            cursor: "pointer",
            marginTop: "0.6rem"
          }}
        >
          {rowIndex === 0 && showPlusIcon ? (
            <>
              {
                <FaPlus
                  className="ms-2"
                  onClick={addRow}
                  size="2em"
                  name={getFieldName(name, "addRow", rowIndex)}
                  onMouseOver={(event) =>
                    (event.currentTarget.style.color = "blue")
                  }
                  onMouseOut={(event) => (event.currentTarget.style.color = "")}
                />
              }
            </>
          ) : (
            <FaMinus
              className="ms-2"
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
