import { FormikProps } from "formik";
import { FieldWrapper, LabelWrapperParams } from "./FieldWrapper";
import classnames from "classnames";
import { InputHTMLAttributes } from "react";

export interface RadioButtonFieldProps extends LabelWrapperParams {
  value: string;
  onChange?: (
    form: FormikProps<any>,
    name: string,
    value: string | null
  ) => void;
}

/**
 * Provides a text input for a Formik field. This component wraps Formik's "Field" component with
 * a wrapper that adds a label.
 */
export function RadionButtonField(props: RadioButtonFieldProps) {
  const { onChange, ...labelWrapperProps } = props;

  return (
    <FieldWrapper {...labelWrapperProps}>
      {({ formik, invalid, value }) => {
        function onChangeInternal() {
          formik.setFieldValue(props.name, value);
          onChange?.(formik, props.name, value);
        }

        const inputPropsInternal: InputHTMLAttributes<any> = {
          className: classnames("form-control"),
          onChange: () => onChangeInternal()
        };

        return <input type="radio" {...inputPropsInternal} />;
      }}
    </FieldWrapper>
  );
}
