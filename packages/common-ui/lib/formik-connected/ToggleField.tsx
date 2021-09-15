import { FieldWrapper, FieldWrapperProps } from "..";
import Switch from "react-switch";

export function ToggleField(props: FieldWrapperProps) {
  return (
    <FieldWrapper {...props}>
      {({ value, setValue }) => (
        <Switch
          className="mx-2"
          checked={!!value ?? false}
          onChange={checked => setValue(checked)}
        />
      )}
    </FieldWrapper>
  );
}
