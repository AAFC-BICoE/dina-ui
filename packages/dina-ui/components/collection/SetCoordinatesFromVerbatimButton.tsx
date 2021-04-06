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

  function validateLatLong(latLong: string, msgKey: string) {
    // if there is no degree, minute or second symbles, consider as degree
    let degreeIdx;
    let minuteIdx;
    let secondIdx;
    degreeIdx = latLong.indexOf("°");
    minuteIdx = latLong.indexOf("′");
    secondIdx = latLong.indexOf("″");

    // consider this as degree when non of the symbles are used
    if (degreeIdx === -1 && minuteIdx === -1 && secondIdx === -1) {
      const numberFormattedLatLong = Number(latLong.slice(0).trim());
      if (numberFormattedLatLong > 90 || numberFormattedLatLong < 0) {
        msgKey === "lat"
          ? setError(
              formatMessage("latitudeValidationError", {
                latitude: latLong
              })
            )
          : setError(
              formatMessage("longitudeValidationError", {
                longtitude: latLong
              })
            );
        return true;
      }
    } else {
      let numberFormattedDegree;
      let numberFormattedMin;
      if (degreeIdx !== -1) {
        numberFormattedDegree = Number(latLong.slice(0, degreeIdx));
        if (
          msgKey === "lat" &&
          (numberFormattedDegree > 90 || numberFormattedDegree < 0)
        ) {
          setError(
            formatMessage("latitudeValidationError", {
              latitude: latLong
            })
          );
          return true;
        } else if (
          msgKey === "long" &&
          (numberFormattedDegree > 180 || numberFormattedDegree < 0)
        ) {
          setError(
            formatMessage("longitudeValidationError", {
              longtitude: latLong
            })
          );
          return true;
        }
      }

      if (minuteIdx !== -1) {
        numberFormattedMin = Number(
          latLong.slice(degreeIdx === -1 ? 0 : degreeIdx + 1, minuteIdx)
        );
        if (
          numberFormattedMin > 60 ||
          numberFormattedMin < 0 ||
          (msgKey === "lat" && numberFormattedDegree === 90) ||
          (msgKey === "long" && numberFormattedDegree === 180)
        ) {
          msgKey === "lat"
            ? setError(
                formatMessage("latitudeValidationError", {
                  latitude: latLong
                })
              )
            : setError(
                formatMessage("longitudeValidationError", {
                  longtitude: latLong
                })
              );
          return true;
        }
      }

      if (secondIdx !== -1) {
        const numberFormattedSec = Number(
          latLong.slice(
            minuteIdx === -1
              ? degreeIdx === -1
                ? 0
                : degreeIdx + 1
              : minuteIdx + 1,
            secondIdx
          )
        );
        if (
          numberFormattedSec > 60 ||
          numberFormattedSec < 0 ||
          numberFormattedMin === 60
        ) {
          msgKey === "lat"
            ? setError(
                formatMessage("latitudeValidationError", {
                  latitude: latLong
                })
              )
            : setError(
                formatMessage("longitudeValidationError", {
                  longtitude: latLong
                })
              );
          return true;
        }
      }
    }
  }

  function doConversion(values: any, formik: FormikContextType<any>) {
    try {
      const latStr = get(values, sourceLatField).replace(/[NnSs]/, "");
      const longStr = get(values, sourceLonField).replace(/[WwEe]/, "");
      if (validateLatLong(latStr, "lat")) return;

      if (validateLatLong(longStr, "long")) return;

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
