import React from "react";
import { useMap, useGraphics, useGraphic, useEvent } from "esri-loader-hooks";
import {
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { CollectingEventFormLayout } from "../../../components/collection/CollectingEventFormLayout";
import { CollectingEventMap } from "../../../components/collection/event-map/CollectingEventMap";
import { useCollectingEventQuery } from "../../../components/collection/useCollectingEvent";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";

export function CollectingEventDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  const collectingEventQuery = useCollectingEventQuery(id?.toString());

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={id as string}
        entityLink="/collection/collecting-event"
        byPassView={true}
      />
      <EditButton
        className="ms-auto"
        entityId={id as string}
        entityLink="collection/collecting-event"
      />
      <Link href={`/collection/collecting-event/revisions?id=${id}`}>
        <a className="btn btn-info">
          <DinaMessage id="revisionsButtonText" />
        </a>
      </Link>
      <DeleteButton
        className="ms-5"
        id={id as string}
        options={{ apiBaseUrl: "/collection-api" }}
        postDeleteRedirect="/collection/collecting-event/list"
        type="collecting-event"
      />
    </ButtonBar>
  );

  // Getting params from URL
  const queryParams = new URLSearchParams(window.location.search);
  const latitude = parseInt(queryParams.get('mlat'));
  const longitude = parseInt(queryParams.get('mlon'));

  return (
    <div>
      <Head title={formatMessage("collectingEventViewTitle")} 
      />
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
            size: "10px",  // pixels
          }}
          map={{
            basemap: "hybrid"
          }}
          options={{
            view: {
              center: [longitude, latitude],
              zoom: 5
            }
          }}
      />
      <Footer />
    </div>
  );
}

export default withRouter(CollectingEventDetailsPage);
