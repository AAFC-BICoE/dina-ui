import { FormikButton } from "common-ui";
import Coordinates from "coordinate-parser";
import { FormikContextType } from "formik";
import { get } from "lodash";
import { useState } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";

export interface SetCoordinatesFromVerbatimButtonProps {
  sourceLatField: string;
  sourceLonField: string;

  targetLatField?: string;
  targetLonField?: string;

  onSetCoords?: (coords: { lat: number; lon: number }) => void;
}

export function SetCoordinatesFromVerbatimButton({
  sourceLatField,
  sourceLonField,
  targetLatField,
  targetLonField,
  onSetCoords
}: SetCoordinatesFromVerbatimButtonProps) {
  const [error, setError] = useState<string>("");

  async function DoRequest(values: any, formik: FormikContextType<any>) {
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
      onSetCoords?.({ lat, lon });

      setError("");
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}
      <FormikButton
        onClick={DoRequest}
        className="btn btn-info"
        buttonProps={({ values }) => ({
          disabled: !get(values, sourceLatField) || !get(values, sourceLonField)
        })}
      >
        <DinaMessage id="latLongAutoSetterButton" />
      </FormikButton>
    </>
  );
}
