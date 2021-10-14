import { FieldWrapper, FieldWrapperProps } from "..";
import Switch from "react-switch";

/** Toggle UI for a boolean field. */
export function ToggleField(props: FieldWrapperProps) {
  return (
    <FieldWrapper {...props} readOnlyRender={value => String(!!value)}>
      {({ value, setValue }) => (
        <Switch
          checked={!!value ?? false}
          onChange={checked => setValue(checked)}
        />
      )}
    </FieldWrapper>
  );
}

/** Toggle UI showing the opposite state (true -> off, false -> on) for a boolean field. */
export function InverseToggleField(props: FieldWrapperProps) {
  return (
    <FieldWrapper {...props}>
      {({ value, setValue }) => (
        <Switch
          checked={!value ?? true}
          onChange={checked => setValue(!checked)}
        />
      )}
    </FieldWrapper>
  );
}
