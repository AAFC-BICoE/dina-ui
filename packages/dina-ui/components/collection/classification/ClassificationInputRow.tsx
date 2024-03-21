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
import { ManualClassificationItem } from "./ClassificationField";

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
  value: ManualClassificationItem;
}

export function ClassificationInputRow({
  rowIndex,
  name,
  showPlusIcon,
  readOnly,
  onAddRow,
  onDeleteRow,
  taxonomicRanOptions,
  value
}: ClassificationInputRowProps) {
  const { locale } = useDinaIntl();
  const classificationRanksFieldName = `${name}.classificationRanks`;
  const classificationPathFieldName = `${name}.classificationPath`;
  const formik = useFormikContext<any>();

  const [selectedType, setSelectedType] = useState<any>();

  return (
    <div className="d-flex w-100 my-1">
      <div className="w-100">
        <Select
          options={taxonomicRanOptions as any}
          value={value.classificationRanks}
        />
      </div>
      <div className="w-100 ms-2">
        <input className="form-control" value={value.classificationPath} />
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
