import { FaCaretRight, FaCaretLeft } from "react-icons/fa";
import React, { useRef, useState } from "react";
import { SelectField, SelectOption } from "./SelectField";

interface SelectFieldWithNavProps<T> {
  name: string;
  options: SelectOption<T>[];
  onSelectionChanged?: (currentSelectedValue) => void;
}

export function SelectFieldWithNav<T = string>(
  props: SelectFieldWithNavProps<T>
) {
  const { name, options } = props;
  const selectRef = useRef<HTMLSelectElement>(null);
  const [leftDisabled, setLeftDisabled] = useState(false);
  const [rightDisabled, setRightDisabled] = useState(false);

  const LeftArrowIcon = leftDisabled ? FaCaretRight : FaCaretLeft;
  const RightArrowIcon = rightDisabled ? FaCaretRight : FaCaretRight;

  function onLeftClick() {
    let index = -1;
    options.map((option, idx) => {
      if (
        JSON.stringify(option.value) ===
        JSON.stringify(selectRef.current?.state.value?.value)
      ) {
        index = idx;
      }
    });
    if (index <= 1) {
      setLeftDisabled(true);
    } else if (selectRef.current) {
      selectRef.current.selectedIndex = index - 1;
      setLeftDisabled(false);
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
      />
    </div>
  );
}
