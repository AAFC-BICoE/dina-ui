import { FaCaretRight, FaCaretLeft } from "react-icons/fa";
import { GoCircleSlash } from "react-icons/go";
import React, { useRef, useState } from "react";
import { SelectField, SelectOption } from "./SelectField";
import { FormikProps } from "formik";

interface SelectFieldWithNavProps<T> {
  name: string;
  options: SelectOption<T>[];
  onSelectionChanged?: (currentSelectedValue) => void;
  form: FormikProps<any>;
}

export function SelectFieldWithNav<T = string>(
  props: SelectFieldWithNavProps<T>
) {
  const { name, options, form } = props;
  const selectRef = useRef<any>(null);
  const [leftDisabled, setLeftDisabled] = useState(false);
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
    const index = findSelectionIndex();
    if (index === 0) {
      setLeftDisabled(true);
      setRightDisabled(false);
    } else {
      form.setFieldValue(name, options[index - 1]?.value);
      setLeftDisabled(false);
    }
  }

  function onRightClick() {
    const index = findSelectionIndex();
    if (index === options.length - 1) {
      setRightDisabled(true);
      setLeftDisabled(false);
    } else {
      form.setFieldValue(name, options[index + 1].value);
      setRightDisabled(false);
    }
  }

  const ForwardSelectField = React.forwardRef<HTMLSelectElement>((_, ref) => (
    <SelectField
      name={name}
      options={options}
      forwardedRef={ref as any}
      className={"col-md-4"}
    />
  ));

  return (
    <div className="row">
      <LeftArrowIcon
        className="col-md-1 leftArrow"
        size="2em"
        onClick={onLeftClick}
        style={{ cursor: "pointer" }}
      />
      <ForwardSelectField ref={selectRef} />
      <RightArrowIcon
        className="col-md-1 rightArrow"
        size="2em"
        style={{ cursor: "pointer" }}
        onClick={onRightClick}
      />
    </div>
  );
}
