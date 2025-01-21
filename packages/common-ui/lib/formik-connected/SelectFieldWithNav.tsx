import { FormikProps } from "formik";
import React, { useRef, useState } from "react";
import { FaCaretLeft, FaCaretRight } from "react-icons/fa";
import { SelectField, SelectOption } from "./SelectField";

interface SelectFieldWithNavProps<T> {
  name: string;
  options: SelectOption<T>[];
  onSelectionChanged?: (index) => void;
  form: FormikProps<any>;
  hideLabel?: boolean;
  className?: string;
}

export function SelectFieldWithNav<T = string>(
  props: SelectFieldWithNavProps<T>
) {
  const { name, options, form, hideLabel, className, onSelectionChanged } =
    props;
  const selectRef = useRef<any>(null);
  const [leftDisabled, setLeftDisabled] = useState(true);
  const [rightDisabled, setRightDisabled] = useState(false);

  function findSelectionIndex() {
    let index = -1;
    options.map((option, idx) => {
      if (
        JSON.stringify(option.value) ===
        JSON.stringify(selectRef.current?.state.value?.value)
      ) {
        index = idx;
      }
    });
    return index;
  }

  function onLeftClick() {
    if (leftDisabled) return;
    const index = findSelectionIndex();
    const newIdx = index - 1;
    form.setFieldValue(name, options[newIdx]?.value);
    setLeftDisabled(false);
    if (newIdx === 0) {
      setLeftDisabled(true);
    }
    setRightDisabled(false);
    onSelectionChanged?.(newIdx);
  }

  function onRightClick() {
    if (rightDisabled) return;
    const index = findSelectionIndex();
    const newIdx = index + 1;
    form.setFieldValue(name, options[newIdx]?.value);
    setRightDisabled(false);
    if (newIdx === options.length - 1) {
      setRightDisabled(true);
    }
    setLeftDisabled(false);
    onSelectionChanged?.(newIdx);
  }

  const ForwardSelectField = React.forwardRef<HTMLSelectElement>((_, ref) => (
    <SelectField
      name={name}
      options={options}
      forwardedRef={ref as any}
      className={className}
      hideLabel={hideLabel}
      onChange={(value, _form) => {
        const newIdx = options.findIndex((option) => value === option.value);
        if (newIdx === options.length - 1) {
          setRightDisabled(true);
          setLeftDisabled(false);
        } else if (newIdx === 0) {
          setLeftDisabled(true);
          setRightDisabled(false);
        } else {
          setLeftDisabled(false);
          setRightDisabled(false);
        }
        onSelectionChanged?.(newIdx);
      }}
    />
  ));

  return (
    <div
      className="d-flex flex-row justify-content-center align-items-center gap-3 "
      style={{ backgroundColor: "#f3f3f3" }}
    >
      <button
        className="btn btn-secondary leftArrow mb-2"
        onClick={onLeftClick}
        type="button"
        style={{
          cursor: "pointer",
          visibility: leftDisabled ? "hidden" : undefined
        }}
      >
        <FaCaretLeft size="1.5em" />
      </button>
      <ForwardSelectField ref={selectRef} />
      <button
        className="btn btn-secondary rightArrow mb-2"
        onClick={onRightClick}
        type="button"
        style={{
          cursor: "pointer",
          visibility: rightDisabled ? "hidden" : undefined
        }}
      >
        <FaCaretRight size="1.5em" />
      </button>
    </div>
  );
}
