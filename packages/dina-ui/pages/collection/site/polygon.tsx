import React from "react";
import NextHead from "next/head";
import { Footer, Head, Nav } from "packages/dina-ui/components";
import { PolygonMap } from "packages/dina-ui/components/collection/site/PolygonMap";
import type { GeoPolygon } from "packages/dina-ui/types/geo/geopolygon";
import ArcGISLoader from "packages/dina-ui/components/geo/ArcGISLoader";

const geopolygon: GeoPolygon = {
  type: "Polygon",
  coordinates: [
    [
      [100.0, 0.0],
      [101.0, 0.0],
      [101.0, 1.0],
      [100.0, 1.0],
      [100.0, 0.0]
    ]
  ]
};

export default function Page() {
  return (
    <div>
      <NextHead>
        <link
          href="https://js.arcgis.com/4.29/esri/themes/dark/main.css"
          rel="stylesheet"
        />
      </NextHead>
      <Head title="Site" />
      <Nav />
      <ArcGISLoader>
        <PolygonMap geopolygon={geopolygon} />
      </ArcGISLoader>
      <Footer />
    </div>
  );
}
