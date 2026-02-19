import { useEffect, useState } from "react";
import NextHead from "next/head";
import { FormattedMessage } from "react-intl";
import { GeoPolygon } from "packages/dina-ui/types/geo/geopolygon";
import ArcGISLoader from "packages/dina-ui/components/geo/ArcGISLoader";
import { PolygonMap } from "packages/dina-ui/components/collection/site/PolygonMap";

interface PolygonMessage {
  type: "Polygon";
  payload: GeoPolygon;
}

export default function PolygonPopup() {
  const [geoPolygon, setGeoPolygon] = useState<GeoPolygon | null>(null);

  // Notify parent when popup is ready
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage(
        { type: "POPUP_READY" },
        window.location.origin
      );
    }
  }, []);

  // Listen for polygon data from parent
  useEffect(() => {
    const handler = (event: MessageEvent<PolygonMessage>) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "Polygon") {
        setGeoPolygon(event.data.payload);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <NextHead>
        <link
          href="https://js.arcgis.com/4.29/esri/themes/dark/main.css"
          rel="stylesheet"
        />
      </NextHead>

      {geoPolygon ? (
        <ArcGISLoader>
          <PolygonMap geoPolygon={geoPolygon} />
        </ArcGISLoader>
      ) : (
        <p>
          <FormattedMessage id="waitingForPolygonData" />
        </p>
      )}
    </div>
  );
}
