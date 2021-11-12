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
  return (
    <FieldWrapper
      name={"materialSampleState"}
      disableLabelClick={true}
      removeLabel={removeLabel}
      removeLabelTag={true}
      className={"my-1"}
    >
      {({ formik, value }) => {
        const metaDate = formik.values.materialSampleStateMetaDate;
        const metaRemarks = formik.values.materialSampleStateMetaRemarks;
        return (
          <>
            {value + metaDate
              ? " - " + metaDate
              : "" + metaRemarks
              ? " - " + metaRemarks
              : ""}
          </>
        );
      }}
    </FieldWrapper>
  );
}
