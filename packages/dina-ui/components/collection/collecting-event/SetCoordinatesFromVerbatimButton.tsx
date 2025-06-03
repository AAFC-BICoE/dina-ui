import { FormikButton, Tooltip, useDinaFormContext } from "common-ui";
import Coordinates from "coordinate-parser";
import { FormikContextType } from "formik";
import _ from "lodash";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { useState } from "react";
import { SiConvertio } from "react-icons/si";

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
  const [error, setError] = useState<string>("");
  const { formatMessage } = useDinaIntl();

  function doConversion(values: any, formik: FormikContextType<any>) {
    try {
      const coords = new Coordinates(
        `${_.get(values, sourceLatField)}, ${_.get(values, sourceLonField)}`
      );

      // Limit to 6 decimal places:
      const lat = Number(coords.getLatitude().toFixed(6));
      const lon = Number(coords.getLongitude().toFixed(6));

      if (lat > 90 || lat < -90) {
        setError(
          formatMessage("latitudeValidationError", {
            latitude: lat
          })
        );
        return;
      }

      if (lon > 180 || lon < -180) {
        setError(
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

      setError("");
    } catch (error) {
      setError(error.message);
    }
  }

  // Don't render in read-only mode.
  return readOnly ? null : (
    <div>
      <FormikButton
        onClick={doConversion}
        className={className}
        buttonProps={({ values }) => ({
          disabled:
            !_.get(values, sourceLatField) || !_.get(values, sourceLonField)
        })}
      >
        {error && <div className="alert alert-danger">{error}</div>}
        <SiConvertio />
      </FormikButton>
      <Tooltip directText={buttonText} />
    </div>
  );
}
