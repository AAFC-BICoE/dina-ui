import { FormikButton } from "common-ui";
import { FormikContextType } from "formik";
import { get } from "lodash";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { useState } from "react";

export interface LatLongSetterProps {
  fetchJson?: (url: string) => Promise<any>;
  verbatimCoords: { lat: string; lon: string };
}

export interface CanadensysResponse {
  type?: string;
  features?: {
    type?: string;
    geometry?: {
      type?: string;
      /** [lon, lat] */
      coordinates?: [number, number];
    };
    properties?: {
      originalValue?: string;
      error?: string;
    };
    id?: string;
  }[];
}

export async function fetchDecimalLatLonFromVerbatim({
  verbatimCoords,
  fetchJson = url => window.fetch(url).then(res => res.json())
}: LatLongSetterProps): Promise<{
  lat: number;
  lon: number;
}> {
  const apiUrl = new URL("https://data.canadensys.net/tools/coordinates.json");
  apiUrl.search = new URLSearchParams({
    data: `${verbatimCoords.lat},${verbatimCoords.lon}`
  }).toString();

  try {
    const response: CanadensysResponse = await fetchJson(apiUrl.toString());

    const lonLat = response.features?.[0]?.geometry?.coordinates;
    if (lonLat) {
      const [lon, lat] = lonLat;
      return { lon, lat };
    }
    throw new Error("No coordinates returned from Canadensys");
  } catch (error) {
    /* tslint:disable-next-line */
    throw new Error("Canadensys request error: " + error.message);
  }
}

export interface GetCoordinatesFromVerbatimButtonProps {
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
}: GetCoordinatesFromVerbatimButtonProps) {
  const [error, setError] = useState<string>("");

  async function DoRequest(values: any, formik: FormikContextType<any>) {
    try {
      const { lat, lon } = await fetchDecimalLatLonFromVerbatim({
        verbatimCoords: {
          lat: get(values, sourceLatField),
          lon: get(values, sourceLonField)
        }
      });

      formik.setFieldValue(targetLatField, lat);
      formik.setFieldValue(targetLonField, lon);
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
