import { FaCaretLeft, FaCaretRight } from "react-icons/fa";
import Select from "react-select";

export interface SelectNavigationProps<T> {
  /** The array index. */
  value: T;
  onChange: (newVal: T) => void;
  elements: T[];
  optionLabel: (element: T) => string | undefined;
  invalidElements?: T[];
}

/** Select menu with arrow button navigation. */
export function SelectNavigation<T extends { key: string }>({
  elements,
  value,
  onChange,
  optionLabel,
  invalidElements
}: SelectNavigationProps<T>) {
  const options = elements.map((element, index) => ({
    label: optionLabel(element) ?? index,
    value: element
  }));

  const selectedIndex = options.findIndex((it) => it.value.key === value.key);

  const selectValue = options.find((option) => option.value.key === value.key);

  const leftDisabled = selectedIndex <= 0;
  const rightDisabled = selectedIndex >= elements.length - 1;

  const invalid = !!invalidElements?.length;

  const customStyle = {
    menu: (base) => ({ ...base, zIndex: 1050 }),
    control: (base) => ({
      ...base,
      ...(invalid && {
        borderColor: "rgb(148, 26, 37)",
        "&:hover": { borderColor: "rgb(148, 26, 37)" }
      })
    }),
    option: (base, option) => {
      const isInvalid = invalidElements?.includes(option?.data?.value);

      return {
        ...base,
        ...(isInvalid
          ? { color: "rgb(148, 26, 37)", backgroundColor: "#f8d7da" }
          : {})
      };
    }
  };

  return (
    <div className="d-flex" style={{ width: "30rem" }}>
      <button
        className="btn btn-info leftArrow mt-4"
        onClick={() => onChange(options[selectedIndex - 1].value)}
        type="button"
        style={{ visibility: leftDisabled ? "hidden" : undefined }}
        disabled={leftDisabled}
      >
        <FaCaretLeft size="1.5em" />
      </button>
      <div className={`flex-grow-1 ${invalid ? "is-invalid" : ""}`}>
        <label className="w-100">
          <div className="fw-bold">Navigation</div>
          <Select
            options={options}
            onChange={(newVal) => newVal?.value && onChange(newVal?.value)}
            value={selectValue}
            styles={customStyle}
          />
        </label>
      </div>
      <button
        className="btn btn-info rightArrow mt-4"
        onClick={() => onChange(options[selectedIndex + 1].value)}
        type="button"
        style={{ visibility: rightDisabled ? "hidden" : undefined }}
        disabled={rightDisabled}
      >
        <FaCaretRight size="1.5em" />
      </button>
    </div>
  );
}
