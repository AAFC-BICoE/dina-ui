import React from "react";
import { useMap, useGraphics, useGraphic, useEvent } from "esri-loader-hooks";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { CollectingEventMap } from "../../../components/collection/event-map/CollectingEventMap";
import { useDinaIntl } from "../../../intl/dina-ui-intl";

export function CollectingEventDetailsPage({ router }: WithRouterProps) {
  const { formatMessage } = useDinaIntl();

  // Getting params from URL
  const queryParams = new URLSearchParams(window.location.search);
  const mlat = queryParams.get("mlat") as string;
  const mlon = queryParams.get("mlon") as string;
  // casting to numbers
  const latitude = Number(mlat);
  const longitude = Number(mlon);

  return (
    <div>
      <Head title={formatMessage("collectingEventViewTitle")} />
      <Nav />
      <CollectingEventMap
        geometry={{
          type: "point", // autocasts as new Point()
          latitude,
          longitude
        }}
        symbol={{
          type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
          color: [226, 119, 40],
          size: "14px" // pixels
        }}
        map={{
          basemap: "hybrid"
        }}
        options={{
          view: {
            center: [longitude, latitude],
            zoom: 12
          }
        }}
      />
      <Footer />
    </div>
  );
}

export default withRouter(CollectingEventDetailsPage);
