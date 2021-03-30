import { FormikButton } from "common-ui";
import Coordinates from "coordinate-parser";
import { FormikContextType } from "formik";
import { get } from "lodash";
import { useState } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";

export interface SetCoordinatesFromVerbatimButtonProps {
  sourceLatField: string;
  sourceLonField: string;

  targetLatField: string;
  targetLonField: string;
}

export function SetCoordinatesFromVerbatimButton({
  sourceLatField,
  sourceLonField,
  targetLatField,
  targetLonField
}: SetCoordinatesFromVerbatimButtonProps) {
  const [error, setError] = useState<string>("");

  async function DoRequest(values: any, formik: FormikContextType<any>) {
    try {
      const coords = new Coordinates(
        `${get(values, sourceLatField)}, ${get(values, sourceLonField)}`
      );

      formik.setFieldValue(targetLatField, coords.getLatitude());
      formik.setFieldValue(targetLonField, coords.getLongitude());
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
