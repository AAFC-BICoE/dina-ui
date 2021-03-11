import { FormikContextType } from "formik";

export interface LatLongSetterProps {
  fetchJson?: (url: string) => Promise<any>;

  onDecimalCoordsFetched: (latLon: {
    lat: number;
    lon: number;
  }) => void | Promise<void>;

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
  onDecimalCoordsFetched,
  fetchJson = url => window.fetch(url).then(res => res.json())
}: LatLongSetterProps) {
  const apiUrl = new URL("https://data.canadensys.net/tools/coordinates.json");
  apiUrl.search = new URLSearchParams({
    data: `${verbatimCoords.lat},${verbatimCoords.lon}`
  }).toString();

  try {
    const response: CanadensysResponse = await fetchJson(apiUrl.toString());

    const lonLat = response.features?.[0]?.geometry?.coordinates;
    if (lonLat) {
      const [lon, lat] = lonLat;
      await onDecimalCoordsFetched({ lon, lat });
    }
  } catch (error) {
    // Do nothing on error to avoid dependency on 3rd party API.
    /* tslint:disable-next-line */
    console.error("Canadensys request error:", error);
  }
}
