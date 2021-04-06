import { FormikButton } from "common-ui";
import Coordinates from "coordinate-parser";
import { FormikContextType } from "formik";
import { get } from "lodash";
import { useDinaIntl } from "../../intl/dina-ui-intl";
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
  const { formatMessage } = useDinaIntl();

  function doConversion(values: any, formik: FormikContextType<any>) {
    try {
      const latArray = (get(values, sourceLatField).replace(/[NnSs]/,"").split(/[°'"]/));
      const longArray = (get(values, sourceLonField).replace(/[WwEe]/, "").split(/[°'"]/));
      let latError = false ;
      let longError = false ;
      //Valid latitude range is between 0 to 90 for degree, and 0 to 60 for minute and second
      latArray.map((lat, idx) => {
        let numberFormattedLat = Number(lat);
        if (lat && (((numberFormattedLat > 90 || numberFormattedLat < 0) &&  idx ===0 ) || ((numberFormattedLat > 60 || numberFormattedLat < 0) &&  idx >0 ))) {
          latError = true;          
          setError(formatMessage("latitudeValidationError", {
            latitude: lat}));
        }
      })
      //Valid longitude is between 0 to 180 for degree, and 0 to 60 for minute and second
      longArray.map((long, idx) => {
        let numberFormattedLong = Number(long);
        if (long && (((numberFormattedLong > 180 || numberFormattedLong < 0) && (idx === 0)) ||
        ((numberFormattedLong > 60 || numberFormattedLong < 0) && (idx > 0)))) {
          longError = true;
          setError(formatMessage("longitudeValidationError", {
            longtitude: long}));
        }
      })      

      if(!latError && !longError){
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
      }
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
