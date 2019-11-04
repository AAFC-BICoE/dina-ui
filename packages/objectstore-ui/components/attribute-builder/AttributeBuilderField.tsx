import { Field, FieldProps } from "formik";
import { AttributeBuilder, ControlledAttribute } from "./AttributeBuilder";
import { AttributeGroupModel } from "./AttributeGroup";

interface AttributeBuilderFieldProps {
  controlledAttributes: ControlledAttribute[];
  name: string;
}

/** Formik-connected attribute builder field. */
export function AttributeBuilderField({
  controlledAttributes,
  name
}: AttributeBuilderFieldProps) {
  return (
    <Field name={name}>
      {({
        field: { value },
        form: { setFieldValue, setFieldTouched }
      }: FieldProps) => {
        function onChange(attributeObject: AttributeGroupModel) {
          setFieldValue(name, attributeObject);
          setFieldTouched(name);
        }
        return (
          <AttributeBuilder
            controlledAttributes={controlledAttributes}
            value={value}
            onChange={onChange}
          />
        );
      }}
    </Field>
  );
}
