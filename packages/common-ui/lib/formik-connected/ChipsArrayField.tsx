import _ from "lodash";
import { ReactNode, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { useIntl } from "react-intl";
import { useFieldLabels } from "../field-header/FieldHeader";
import { FieldWrapper, FieldWrapperProps } from "./FieldWrapper";

export interface ChipsArrayFieldProps extends FieldWrapperProps {
  /**
   * Shows the chips without letting values be added or removed.
   */
  disabled?: boolean;
}

/**
 * A string array field shown as removable chips. Enter adds a value, Backspace on an empty
 * input removes the last one, and Escape clears what's being typed.
 *
 * Recommended alternative to StringArrayField's one-value-per-line textarea.
 */
export function ChipsArrayField({ disabled, ...props }: ChipsArrayFieldProps) {
  const { getFieldLabel } = useFieldLabels();
  const label =
    typeof props.label === "string"
      ? props.label
      : getFieldLabel({ name: props.customName ?? props.name }).fieldLabel;

  return (
    <FieldWrapper
      // The label wraps the chips' remove buttons, so a label click would "click" the first one.
      disableLabelClick={true}
      readOnlyRender={(value) => (
        <ChipList>
          {_.compact(value as string[]).map((item, index) => (
            <Chip key={index}>{item}</Chip>
          ))}
        </ChipList>
      )}
      {...props}
    >
      {({ value, setValue }) => (
        <ChipsInput
          values={_.compact(value as string[])}
          onChange={setValue}
          disabled={disabled}
          label={label}
        />
      )}
    </FieldWrapper>
  );
}

function ChipsInput({
  values,
  onChange,
  disabled,
  label
}: {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  label: string;
}) {
  const { formatMessage } = useIntl();
  const [draft, setDraft] = useState("");

  function addDraft() {
    const item = draft.trim();
    if (item && !values.includes(item)) {
      onChange([...values, item]);
    }
    setDraft("");
  }

  return (
    <div className="chips-input flex-grow-1">
      {values.map((item, index) => (
        <Chip
          key={index}
          onRemove={
            disabled
              ? undefined
              : () => onChange(values.filter((_item, i) => i !== index))
          }
          removeLabel={formatMessage({ id: "removeValue" }, { value: item })}
        >
          {item}
        </Chip>
      ))}
      <input
        type="text"
        className="chips-input-draft"
        aria-label={label}
        placeholder={formatMessage({ id: "typeAndPressEnter" })}
        disabled={disabled}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        // Keep a typed value that wasn't confirmed with Enter, e.g. when clicking Save.
        onBlur={addDraft}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addDraft();
          } else if (event.key === "Escape") {
            setDraft("");
          } else if (event.key === "Backspace" && !draft && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
      />
    </div>
  );
}

export function ChipList({ children }: { children: ReactNode }) {
  return <div className="d-flex flex-wrap gap-2">{children}</div>;
}

/** A pill-shaped value. Pass onRemove to show a remove button. */
export function Chip({
  children,
  onRemove,
  removeLabel
}: {
  children: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const { formatMessage } = useIntl();
  return (
    <span className="dina-chip">
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          className="dina-chip-remove"
          title={formatMessage({ id: "remove" })}
          aria-label={removeLabel}
          onClick={onRemove}
        >
          <FaXmark size={11} />
        </button>
      )}
    </span>
  );
}
