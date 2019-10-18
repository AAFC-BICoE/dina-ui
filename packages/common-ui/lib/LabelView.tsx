import { LabelWrapperParams } from "./formik-connected/FieldWrapper";
/** Renders the label field */
export function LabelView(props: LabelWrapperParams) {
  const { className, label } = props;
  return (
    <div className={className}>
      <p
        style={{
          borderBottom: "1px solid black",
          borderRight: "1px solid black",
          minHeight: "25px"
        }}
      >
        {label}
      </p>
    </div>
  );
}
