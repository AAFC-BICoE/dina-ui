import { FaCaretLeft, FaCaretRight } from "react-icons/fa";
import Select from "react-select";

export interface SelectNavigationProps<T> {
  /** The array index. */
  value: number;
  onChange: (newVal: number) => void;
  elements: T[];
  optionLabel: (element: T) => string | undefined;
}

/** Select menu with arrow button navigation. */
export function SelectNavigation<T>({
  elements,
  value,
  onChange,
  optionLabel
}: SelectNavigationProps<T>) {
  const options = elements.map((element, index) => ({
    label: optionLabel(element) ?? index,
    value: index
  }));

  const selectValue = options.find(option => option.value === value);

  const leftDisabled = value <= 0;
  const rightDisabled = value >= elements.length - 1;

  return (
    <div className="d-flex" style={{ width: "30rem" }}>
      <button
        className="btn btn-info leftArrow mb-2"
        onClick={() => onChange(value - 1)}
        type="button"
        style={{ visibility: leftDisabled ? "hidden" : undefined }}
        disabled={leftDisabled}
      >
        <FaCaretLeft size="1.5em" />
      </button>
      <div className="flex-grow-1">
        <Select
          options={options}
          onChange={newVal => onChange(newVal?.value ?? 0)}
          value={selectValue}
        />
      </div>
      <button
        className="btn btn-info rightArrow mb-2"
        onClick={() => onChange(value + 1)}
        type="button"
        style={{ visibility: rightDisabled ? "hidden" : undefined }}
        disabled={rightDisabled}
      >
        <FaCaretRight size="1.5em" />
      </button>
    </div>
  );
}
