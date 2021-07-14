import { FaCaretRight, FaCaretLeft } from "react-icons/fa";
import { GoCircleSlash } from "react-icons/go";
import React, { useRef, useState } from "react";
import { SelectField, SelectOption } from "./SelectField";
import { FormikProps } from "formik";

interface SelectFieldWithNavProps<T> {
  name: string;
  options: SelectOption<T>[];
  onSelectionChanged?: (index) => void;
  form: FormikProps<any>;
}

export function SelectFieldWithNav<T = string>(
  props: SelectFieldWithNavProps<T>
) {
  const { name, options, form, onSelectionChanged } = props;
  const selectRef = useRef<any>(null);
  const [leftDisabled, setLeftDisabled] = useState(true);
  const [rightDisabled, setRightDisabled] = useState(false);

  const LeftArrowIcon = leftDisabled ? GoCircleSlash : FaCaretLeft;
  const RightArrowIcon = rightDisabled ? GoCircleSlash : FaCaretRight;

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
      setRightDisabled(false);
    }
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
      setLeftDisabled(false);
    }
    onSelectionChanged?.(newIdx);
  }

  const ForwardSelectField = React.forwardRef<HTMLSelectElement>((_, ref) => (
    <SelectField
      name={name}
      options={options}
      forwardedRef={ref as any}
      className={"col-md-4"}
      onChange={(value, _form) =>
        onSelectionChanged?.(
          options.findIndex(option => value === option.value)
        )
      }
    />
  ));

  return (
    <div className="row">
      <LeftArrowIcon
        className="col-md-1 leftArrow"
        size="2em"
        onClick={onLeftClick}
        style={{ cursor: leftDisabled ? "not-allowed" : "pointer" }}
      />
      <ForwardSelectField ref={selectRef} />
      <RightArrowIcon
        className="col-md-1 rightArrow"
        size="2em"
        style={{ cursor: rightDisabled ? "not-allowed" : "pointer" }}
        onClick={onRightClick}
      />
    </div>
  );
}
