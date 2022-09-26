import { useDinaFormContext, FieldWrapper } from "common-ui";
import { BsExclamationTriangle } from "react-icons/bs";
import { useFormikContext } from "formik";

export function MaterialSampleStateWarning() {
  const { readOnly } = useDinaFormContext();
  const { values } = useFormikContext<any>();

  if (!readOnly || !values.materialSampleState) {
    return null;
  }

  return (
    <div className="bg-danger card text-white py-1 px-3" role="alert">
      <div className="d-flex gap-2 align-items-center">
        <BsExclamationTriangle style={{ width: "24px", height: "24px" }} />
        <div style={{ font: "fw-bold", fontSize: "1.2em" }} className="mt-3">
          <MaterialSampleStateReadOnlyRender removeLabel={true} />
        </div>
      </div>
    </div>
  );
}

export function MaterialSampleStateReadOnlyRender({ removeLabel }) {
  function renderAsReadOnly(value, formik) {
    // Do not render anything if the state has empty value
    if (!value) return <></>;

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
      readOnlyRender={renderAsReadOnly}
    >
      <></>
    </FieldWrapper>
  );
}
