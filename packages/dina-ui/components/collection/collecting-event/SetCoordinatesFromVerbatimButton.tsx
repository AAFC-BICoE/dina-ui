import { FormikButton, useDinaFormContext } from "common-ui";
import Coordinates from "coordinate-parser";
import { FormikContextType } from "formik";
import _ from "lodash";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { useEffect, useState } from "react";
import {
  FaArrowsRotate,
  FaCheck,
  FaTriangleExclamation
} from "react-icons/fa6";

export interface SetCoordinatesFromVerbatimButtonProps {
  /** Button content */
  buttonText: string;
  className?: string;

  sourceLatField: string;
  sourceLonField: string;

  targetLatField?: string;
  targetLonField?: string;

  onClick?: (coords: { lat: string; lon: string }) => void;
}

/** Provides lat/lon from verbatim fields in decimal format. */
export function SetCoordinatesFromVerbatimButton({
  sourceLatField,
  sourceLonField,
  targetLatField,
  targetLonField,
  onClick,
  className = "btn btn-info",
  buttonText
}: SetCoordinatesFromVerbatimButtonProps) {
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

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

  function doConversion(values: any, formik: FormikContextType<any>) {
    // Reset status before processing
    setStatus("idle");
    setFeedbackMsg("");

    try {
      const latitudeStr = _.get(values, sourceLatField, "");
      const longitudeStr = _.get(values, sourceLonField, "");

      const coords = new Coordinates(`${latitudeStr}, ${longitudeStr}`);

      // Limit to 6 decimal places:
      const lat = Number(coords.getLatitude().toFixed(6));
      const lon = Number(coords.getLongitude().toFixed(6));

      if (lat > 90 || lat < -90) {
        setStatus("error");
        setFeedbackMsg(
          formatMessage("latitudeValidationError", {
            latitude: lat
          })
        );
        return;
      }

      if (lon > 180 || lon < -180) {
        setStatus("error");
        setFeedbackMsg(
          formatMessage("longitudeValidationError", {
            longtitude: lon
          })
        );
        return;
      }

      if (targetLatField) {
        formik.setFieldValue(targetLatField, lat);
      }
      if (targetLonField) {
        formik.setFieldValue(targetLonField, lon);
      }
      onClick?.({ lat: String(lat), lon: String(lon) });

      setStatus("success");
      setFeedbackMsg("Coordinates set");
    } catch (error) {
      setStatus("error");
      setFeedbackMsg(error.message);
    }
  }

  // Don't render in read-only mode.
  return readOnly ? null : (
    <div className="d-flex align-items-center gap-2">
      <FormikButton
        onClick={doConversion}
        className={className}
        buttonProps={({ values }) => ({
          disabled:
            !_.get(values, sourceLatField) || !_.get(values, sourceLonField)
        })}
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
