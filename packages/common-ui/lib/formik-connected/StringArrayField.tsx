import { isEqual } from "lodash";
import { useEffect } from "react";
import { InputHTMLAttributes, useState } from "react";
import { FieldHeader } from "../field-header/FieldHeader";
import { CommonMessage } from "../intl/common-ui-intl";
import { Tooltip } from "../tooltip/Tooltip";
import { useDinaFormContext } from "./DinaForm";
import { TextField, TextFieldProps } from "./TextField";
import TextareaAutosize from "react-textarea-autosize";

export function StringArrayField(
  props: Omit<TextFieldProps, "customInput" | "multiLines">
) {
  const { horizontal, readOnly } = useDinaFormContext();

  return (
    <TextField
      {...props}
      // Add the "One per line" and tooltip to the field label:
      label={
        <div className={`${horizontal ? "" : "d-flex"} align-items-center`}>
          {props.label ? (
            props.label
          ) : (
            <FieldHeader name={props.name} customName={props.customName} />
          )}
          <div className={horizontal ? "" : "ms-2"}>
            {!readOnly && (
              <>
                (<CommonMessage id="oneValuePerLine" />)
              </>
            )}
            {!readOnly && <Tooltip id="oneValuePerLineTooltip" />}
          </div>
        </div>
      }
      customInput={inputProps => <StringArrayFieldInternal {...inputProps} />}
    />
  );
}

function StringArrayFieldInternal(
  inputProps: Omit<InputHTMLAttributes<any>, "style">
) {
  const [textValue, setTextValue] = useState("");

  // When the outer form state changes, set the inner text state:
  useEffect(() => {
    if (!isEqual(inputProps.value, asArray(textValue))) {
      setTextValue(asText((inputProps.value || []) as string[]));
    }
  }, [inputProps.value]);

  function onChange(newText: string) {
    setTextValue(newText);

    const newTextAsArray = asArray(newText);

    // When the inner text state changes, set the outer form state:
    if (!isEqual(newTextAsArray, inputProps.value)) {
      inputProps.onChange?.({ target: { value: newTextAsArray } } as any);
    }
  }

  return (
    <TextareaAutosize
      minRows={4}
      {...inputProps}
      onChange={event => onChange(event.target.value)}
      value={textValue}
    />
  );
}

function asArray(text?: string) {
  return (
    text
      // Split by line breaks:
      ?.match(/[^\r\n]+/g)
      // Remove empty lines:
      ?.filter(line => line.trim()) ?? []
  );
}

function asText(array?: string[]) {
  return (array ?? []).concat("").join("\n");
}
