import { FormikButton, OnFormikSubmit, toMeters } from "common-ui";
import { useField } from "formik";
import { get } from "lodash";
import { CollectingEvent } from "../../types/collection-api";

export interface ParseVerbatimToRangeButtonProps {
  verbatimField: string;
  rangeFields: [string, string];
  buttonText: string;
}

export function ParseVerbatimToRangeButton({
  verbatimField,
  rangeFields: [minField, maxField],
  buttonText
}) {
  const convertToMinMax: OnFormikSubmit<Partial<CollectingEvent>> = (
    values,
    formik
  ) => {
    const currentMin = get(values, minField);
    const currentMax = get(values, maxField);

    const verbatimText: string = get(values, verbatimField)?.toString() ?? "";
    const [newMin, newMax] = verbatimText
      .split(/to|\-/)
      .map(text => toMeters(text));

    if (newMin && !currentMin) {
      formik.setFieldValue(minField, newMin);
      if (newMax && !currentMax) {
        formik.setFieldValue(maxField, newMax);
      }
    }
  };

  return (
    <FormikButton
      className="btn btn-info mb-3 parse-verbatim-to-range-button"
      onClick={convertToMinMax}
      buttonProps={({ values }) => ({ disabled: !!get(values, minField) })}
    >
      {buttonText}
    </FormikButton>
  );
}
