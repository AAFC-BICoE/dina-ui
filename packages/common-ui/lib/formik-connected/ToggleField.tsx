import { FormikContextType } from "formik";
import Switch from "react-switch";
import { FieldWrapper, FieldWrapperProps } from "..";

export interface ToggleFieldProps extends FieldWrapperProps {
  onChangeExternal?: (checked: boolean, formik: FormikContextType<any>) => void;
  disableSwitch?: boolean;
}

/** Toggle UI for a boolean field. */
export function ToggleField({
  onChangeExternal,
  disableSwitch,
  ...props
}: ToggleFieldProps) {
  return (
    <FieldWrapper
      {...props}
      readOnlyRender={(value) => String(!!value)}
      disableLabelClick={true}
    >
      {({ value, setValue, formik }) => (
        <Switch
          disabled={disableSwitch}
          checked={!!value ?? false}
          onChange={(checked) => {
            setValue(checked);
            onChangeExternal?.(checked, formik);
          }}
        />
      )}
    </FieldWrapper>
  );
}

/** Toggle UI for a boolean field. */
export function StringToggleField({
  onChangeExternal,
  ...props
}: ToggleFieldProps) {
  return (
    <FieldWrapper {...props}>
      {({ value, setValue, formik }) => (
        <Switch
          checked={(value === "true" || value === true) ?? false}
          onChange={(checked) => {
            setValue(String(checked));
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
          onChange={(checked) => {
            setValue(!checked);
            onChangeExternal?.(!checked, formik);
          }}
        />
      )}
    </FieldWrapper>
  );
}
