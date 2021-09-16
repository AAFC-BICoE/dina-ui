import { FieldWrapper, FieldWrapperProps } from "..";
import Switch from "react-switch";

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
