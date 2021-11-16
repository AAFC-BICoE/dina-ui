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
    <div className="alert-danger px-1" role="alert">
      <div className="d-flex gap-2 align-items-center">
        <BsExclamationTriangle style={{ width: "24px", height: "24px" }} />
        <span style={{ font: "fw-bold", fontSize: "1.2em" }}>
          <MaterialSampleStateReadOnlyRender removeLabel={true} />
        </span>
      </div>
    </div>
  );
}

export function MaterialSampleStateReadOnlyRender({ removeLabel }) {
  function renderAsReadOnly(value, formik) {
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
      removeLabelTag={true}
      className={"my-1"}
      readOnlyRender={renderAsReadOnly}
    >
      <></>
    </FieldWrapper>
  );
}
