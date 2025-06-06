import {
  FormikButton,
  OnFormikSubmit,
  toMeters,
  Tooltip,
  useDinaFormContext
} from "common-ui";
import _ from "lodash";
import { CollectingEvent } from "../../../types/collection-api";
import { SiConvertio } from "react-icons/si";

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
    const verbatimText: string = _.get(values, verbatimField)?.toString() ?? "";
    const [newMin, newMax] = verbatimText
      .split(/to|\-/)
      .map((text) => toMeters(text));

    formik.setFieldValue(minField, newMin);
    formik.setFieldValue(maxField, newMax);
  };

  const { readOnly } = useDinaFormContext();

  return readOnly ? null : (
    <div className="mb-3">
      <FormikButton
        className="btn btn-info parse-verbatim-to-range-button"
        onClick={convertToMinMax}
      >
        <SiConvertio />
      </FormikButton>
      <Tooltip directText={buttonText} />
    </div>
  );
}
