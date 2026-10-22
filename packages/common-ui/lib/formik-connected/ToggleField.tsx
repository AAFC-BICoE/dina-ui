import { FormikContextType } from "formik";
import Switch from "react-switch";
import { FieldWrapper, FieldWrapperProps, useDinaFormContext } from "..";
import { FaCheckSquare, FaRegSquare } from "react-icons/fa";

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
  const { compact } = useDinaFormContext();

  return (
    <FieldWrapper
      {...props}
      readOnlyRender={(value) =>
        !!value ? <FaCheckSquare /> : <FaRegSquare />
      }
      disableLabelClick={true}
    >
      {({ value, setValue, formik }) => (
        <div
          className="d-flex align-items-center"
          style={
            compact ? { minHeight: "calc(1.5em + 0.75rem + 2px)" } : undefined
          }
        >
          <Switch
            disabled={disableSwitch}
            checked={!!value}
            onChange={(checked) => {
              setValue(checked);
              onChangeExternal?.(checked, formik);
            }}
          />
        </div>
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
          checked={value !== undefined ? !value : false}
          onChange={(checked) => {
            setValue(!checked);
            onChangeExternal?.(!checked, formik);
          }}
        />
      )}
    </FieldWrapper>
  );
}
