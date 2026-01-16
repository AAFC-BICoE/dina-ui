import {
  FormikButton,
  OnFormikSubmit,
  toMeters,
  useDinaFormContext
} from "common-ui";
import _ from "lodash";
import { useEffect, useState } from "react";
import {
  FaArrowsRotate,
  FaCheck,
  FaTriangleExclamation
} from "react-icons/fa6";
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
}: ParseVerbatimToRangeButtonProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedbackMsg, setFeedbackMsg] = useState<string>("");

  // Clear the status message after 5 seconds
  useEffect(() => {
    if (status !== "idle") {
      const timer = setTimeout(() => {
        setStatus("idle");
        setFeedbackMsg("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const convertToMinMax: OnFormikSubmit<Partial<CollectingEvent>> = (
    values,
    formik
  ) => {
    setStatus("idle");
    setFeedbackMsg("");

    const verbatimText: string = (
      _.get(values, verbatimField)?.toString() ?? ""
    ).trim();

    // Ensure not empty
    if (!verbatimText) {
      setStatus("error");
      setFeedbackMsg("Field is empty");
      return;
    }

    const validNumbers = verbatimText
      .split(/to|\-/)
      .map((text) => toMeters(text))
      .filter((val) => !_.isNil(val) && val !== "");

    if (validNumbers.length >= 2) {
      // Range found (take the first two valid numbers)
      formik.setFieldValue(minField, validNumbers[0]);
      formik.setFieldValue(maxField, validNumbers[1]);
      setStatus("success");
      setFeedbackMsg("Min and Max values set");
    } else if (validNumbers.length === 1) {
      // Single value found (Set Min, Clear Max)
      formik.setFieldValue(minField, validNumbers[0]);
      formik.setFieldValue(maxField, null);
      setStatus("success");
      setFeedbackMsg("Min value set");
    } else {
      // No valid numbers found
      setStatus("error");
      setFeedbackMsg("Could not parse value");
    }
  };

  const { readOnly } = useDinaFormContext();

  return readOnly ? null : (
    <div className="mb-3 d-flex align-items-center gap-2">
      <FormikButton
        className="btn btn-info parse-verbatim-to-range-button"
        onClick={convertToMinMax}
      >
        <FaArrowsRotate className="me-2" />
        {buttonText}
      </FormikButton>

      {/* Success Indicator */}
      {status === "success" && (
        <span className="text-success d-flex align-items-center animate-fade-in">
          <FaCheck className="me-1" /> {feedbackMsg}
        </span>
      )}

      {/* Error Indicator */}
      {status === "error" && (
        <span className="text-danger d-flex align-items-center animate-fade-in">
          <FaTriangleExclamation className="me-1" /> {feedbackMsg}
        </span>
      )}
    </div>
  );
}
