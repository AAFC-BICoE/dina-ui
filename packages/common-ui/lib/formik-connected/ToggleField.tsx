import { FormikContextType } from "formik";
import Switch from "react-switch";
import { FieldWrapper, FieldWrapperProps } from "..";

export interface ToggleFieldProps extends FieldWrapperProps {
  onChangeExternal?: (checked: boolean, formik: FormikContextType<any>) => void;
  overrideValue?: boolean;
}

/** Toggle UI for a boolean field. */
export function ToggleField({ 
  overrideValue,
  onChangeExternal, ...props }: ToggleFieldProps) {
    
  return (
    <FieldWrapper {...props} readOnlyRender={value => String(!!value)}>
      {({ value, setValue, formik }) => (
        <Switch
          checked={(typeof overrideValue != "undefined") ? overrideValue : (!!value ?? false)}
          onChange={checked => {
            setValue(checked);
            onChangeExternal?.(checked, formik);
          }}
        />
      )}
    </FieldWrapper>
  );
}

/** Toggle UI showing the opposite state (true -> off, false -> on) for a boolean field. */
export function InverseToggleField({
  onChangeExternal,
  ...props
}: ToggleFieldProps) {
  return (
    <FieldWrapper {...props}>
      {({ value, setValue, formik }) => (
        <Switch
          checked={!value ?? true}
          onChange={checked => {
            setValue(!checked);
            onChangeExternal?.(!checked, formik);
          }}
        />
      )}
    </FieldWrapper>
  );
}
