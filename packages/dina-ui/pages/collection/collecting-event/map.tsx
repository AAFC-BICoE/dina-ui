import { withRouter } from "next/router";
import React from "react";
import NextHead from "next/head";
import { Footer, Head, Nav, CollectingEventMap } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import ArcGISLoader from "packages/dina-ui/components/geo/ArcGISLoader";

export function CollectingEventDetailsPage() {
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
      <NextHead>
        <link
          href="https://js.arcgis.com/4.29/esri/themes/dark/main.css"
          rel="stylesheet"
        />
      </NextHead>
      <Head title={formatMessage("collectingEvent")} />
      <Nav />
      <ArcGISLoader>
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
      </ArcGISLoader>
      <Footer />
    </div>
  );
}

export default withRouter(CollectingEventDetailsPage);
