import { FormikButton } from "common-ui";
import Coordinates from "coordinate-parser";
import { FormikContextType } from "formik";
import { get } from "lodash";
import { ReactNode, useState } from "react";

export interface SetCoordinatesFromVerbatimButtonProps {
  /** Button content */
  children: ReactNode;
  className?: string;

  sourceLatField: string;
  sourceLonField: string;

  targetLatField?: string;
  targetLonField?: string;

  onClick?: (coords: { lat: number; lon: number }) => void;
}

/** Provides lat/lon from verbatim fields in decimal format. */
export function SetCoordinatesFromVerbatimButton({
  sourceLatField,
  sourceLonField,
  targetLatField,
  targetLonField,
  onClick,
  className = "btn btn-info",
  children
}: SetCoordinatesFromVerbatimButtonProps) {
  const [error, setError] = useState<string>("");

  function doConversion(values: any, formik: FormikContextType<any>) {
    try {
      const coords = new Coordinates(
        `${get(values, sourceLatField)}, ${get(values, sourceLonField)}`
      );

      const lat = coords.getLatitude();
      const lon = coords.getLongitude();

      if (targetLatField) {
        formik.setFieldValue(targetLatField, lat);
      }
      if (targetLonField) {
        formik.setFieldValue(targetLonField, lon);
      }
      onClick?.({ lat, lon });

      setError("");
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <FormikButton
      onClick={doConversion}
      className={className}
      buttonProps={({ values }) => ({
        disabled: !get(values, sourceLatField) || !get(values, sourceLonField)
      })}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {children}
    </FormikButton>
  );
}
