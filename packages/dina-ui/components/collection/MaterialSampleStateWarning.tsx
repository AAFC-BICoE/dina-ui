import { useDinaFormContext, FieldWrapper, Tooltip, DinaFormSection } from "common-ui";
import { BsExclamationTriangle } from "react-icons/bs";
import { useFormikContext } from "formik";

export function MaterialSampleStateWarning() {
  const { readOnly } = useDinaFormContext();
  const { values } = useFormikContext<any>();

  if (!readOnly || !values.materialSampleState) {
    return null;
  }

  return (
    <DinaFormSection horizontal="flex">
      <div className="d-flex flex-row gap-2 mb-2">
        <Tooltip 
          visibleElement={(
            <div
              className="card pill py-1 px-2 d-flex flex-row align-items-center gap-1 label-default label-outlined bg-danger"
            >
              <BsExclamationTriangle className="text-white"/>
              <span className="text-white"><MaterialSampleStateReadOnlyRender removeLabel={true} /></span>
            </div>                    
          )} 
          id="field_materialSampleState"
          disableSpanMargin={true}
        />
      </div>
    </DinaFormSection>
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
      removeBottomMargin={removeLabel}
      
      readOnlyRender={renderAsReadOnly}
    >
      <></>
    </FieldWrapper>
  );
}
