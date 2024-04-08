import {
  CheckBoxField,
  CreatableSelectField,
  FieldSpy,
  SelectField,
  SelectOption,
  TextField,
  Tooltip
} from "common-ui";
import classnames from "classnames";
import Select from "react-select";
import { useFormikContext } from "formik";
import { find, get } from "lodash";
import { FaMinus, FaPlus } from "react-icons/fa";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { useEffect, useState } from "react";
import {
  VocabularyOption,
  VocabularySelectField
} from "../VocabularySelectField";
import { ClassificationItem } from "packages/dina-ui/types/collection-api";

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
  onAddRow: () => void;
  onDeleteRow: (index) => void;
  taxonomicRanOptions: { label: string; value: string }[] | undefined;
  value: ClassificationItem;
  onChange: (value: ClassificationItem) => void;
}

export function ClassificationInputRow({
  rowIndex,
  name,
  showPlusIcon,
  readOnly,
  onAddRow,
  onDeleteRow,
  onChange,
  taxonomicRanOptions,
  value: valueProp
}: ClassificationInputRowProps) {
  const { locale } = useDinaIntl();
  const classificationRanksFieldName = `${name}.classificationRanks`;
  const classificationPathFieldName = `${name}.classificationPath`;
  const formik = useFormikContext<any>();
  const [selectedType, setSelectedType] = useState<any>();

  const [value, setValue] = useState<ClassificationItem>(valueProp);

  function internalOnRankChange(option) {
    const rank = option?.value;
    const newValue = {
      ...value,
      classificationRanks: rank
    };
    setValue(newValue);
    onChange(newValue);
  }

  function internalOnPathChange(event) {
    const path = event.target.value;
    const newValue = {
      ...value,
      classificationPath: path
    };
    setValue(newValue);
    onChange(newValue);
  }

  return (
    <div className="d-flex w-100 my-1">
      <div className="w-100">
        <Select
          id="classificationRank"
          options={taxonomicRanOptions}
          value={taxonomicRanOptions?.find(
            (item) => item.value === value.classificationRanks
          )}
          onChange={internalOnRankChange}
        />
      </div>
      <div className="w-100 ms-2">
        <input
          id="classificationPath"
          className="form-control"
          value={value.classificationPath}
          onChange={internalOnPathChange}
        />
      </div>
      {!readOnly && (
        <div
          style={{
            cursor: "pointer",
            marginTop: "0.3rem",
            maxWidth: "2.5rem"
          }}
        >
          {rowIndex === 0 && showPlusIcon ? (
            <>
              {
                <FaPlus
                  className="ms-2"
                  onClick={onAddRow}
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
              onClick={() => onDeleteRow(rowIndex)}
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
