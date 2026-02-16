import React from "react";
import NextHead from "next/head";
import { Footer, Head, Nav, PolygonMap } from "packages/dina-ui/components";
import type { GeoPolygon } from "packages/dina-ui/types/geo/geopolygon";

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
      <PolygonMap geopolygon={geopolygon} />
      <Footer />
    </div>
  );
}
