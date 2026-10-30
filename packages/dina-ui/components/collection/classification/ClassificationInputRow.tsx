import { ClassificationItem } from "packages/dina-ui/types/collection-api";
import { useState } from "react";
import { FaMinus } from "react-icons/fa";
import Select from "react-select";
import { DinaMessage } from "../../../intl/dina-ui-intl";

export interface ClassificationInputRowProps {
  rowIndex: number;
  onDeleteRow: (index) => void;
  taxonomicRanOptions: { label: string; value: string }[] | undefined;
  value: ClassificationItem;
  onChange: (value: ClassificationItem) => void;
}

export function ClassificationInputRow({
  rowIndex,
  onDeleteRow,
  onChange,
  taxonomicRanOptions,
  value: valueProp
}: ClassificationInputRowProps) {
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
    const path = (event.target as HTMLTextAreaElement | HTMLInputElement).value;
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
          value={
            taxonomicRanOptions?.find(
              (item) => item.value === value.classificationRanks
            ) || ""
          }
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
      <div className="ms-2 d-flex align-items-center">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
          onClick={() => onDeleteRow(rowIndex)}
          aria-label={`Remove classification rank ${rowIndex + 1}`}
          title="Remove classification rank"
        >
          <FaMinus size="0.85em" />
          <DinaMessage id="removeClassificationRank" />
        </button>
      </div>
    </div>
  );
}
