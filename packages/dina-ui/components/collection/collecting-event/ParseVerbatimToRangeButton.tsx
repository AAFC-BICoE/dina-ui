import {
  FormikButton,
  OnFormikSubmit,
  toMeters,
  useDinaFormContext
} from "common-ui";
import { get } from "lodash";
import { CollectingEvent } from "../../../types/collection-api";

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
    const verbatimText: string = get(values, verbatimField)?.toString() ?? "";
    const [newMin, newMax] = verbatimText
      .split(/to|\-/)
      .map((text) => toMeters(text));

    formik.setFieldValue(minField, newMin);
    formik.setFieldValue(maxField, newMax);
  };

  const { readOnly } = useDinaFormContext();

  return readOnly ? null : (
    <FormikButton
      className="btn btn-info mb-3 parse-verbatim-to-range-button"
      onClick={convertToMinMax}
    >
      {buttonText}
    </FormikButton>
  );
}
