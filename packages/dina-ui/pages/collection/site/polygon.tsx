import React from "react";
import { Footer, Head, Nav } from "packages/dina-ui/components";
import { PolygonMap } from "packages/dina-ui/components/collection/site/PolygonMap";
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
      <Head title="Site" />
      <Nav />
      <PolygonMap geopolygon={geopolygon} />
      <Footer />
    </div>
  );
}
