import { FieldWrapper, EmptyFieldValue } from "common-ui";

export function MaterialSampleStateReadOnlyRender({ removeLabel }) {
  function renderAsReadOnly(value, formik) {
    if (!value) return <EmptyFieldValue />;

    const metaDate = formik.values.stateChangedOn;
    const metaRemarks = formik.values.stateChangeRemarks;
    const combinedMeta =
      value +
      `${metaDate ? " - " + metaDate : ""}` +
      `${metaRemarks ? " - " + metaRemarks : ""}`;
    return <>{combinedMeta}</>;
  }

  return (
    <FieldWrapper
      name={"materialSampleState"}
      disableLabelClick={true}
      removeLabel={removeLabel}
      removeBottomMargin={removeLabel}
      readOnlyRender={renderAsReadOnly}
    >
      <></>
    </FieldWrapper>
  );
}
