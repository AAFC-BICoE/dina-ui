import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import NextHead from "next/head";
import ArcGISLoader from "packages/dina-ui/components/geo/ArcGISLoader";
import { PolygonEditorMap } from "packages/dina-ui/components/collection/site/PolygonEditorMap";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { POLYGON_EDITOR_MODE } from "packages/dina-ui/types/geo/polygon-editor-mode.types";
import {
  PostMessage,
  PostMessageType
} from "packages/dina-ui/types/geo/post-message.types";
import type { PolygonEditorMode } from "packages/dina-ui/types/geo/polygon-editor-mode.types";
import type { GeoPolygon } from "packages/dina-ui/types/geo/geo.types";

export default function PolygonEditorPage() {
  const [geoPolygon, setGeoPolygon] = useState<GeoPolygon | null>(null);
  const { formatMessage } = useDinaIntl();
  const router = useRouter();

  if (!router.isReady) {
    return <div>{formatMessage("loadingSpinner")}</div>;
  }

  const modeParam = router.query.mode;
  const mode = Object.values(POLYGON_EDITOR_MODE).includes(
    modeParam as PolygonEditorMode
  )
    ? (modeParam as PolygonEditorMode)
    : undefined;

  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: PostMessageType.PopupReady },
        window.location.origin
      );
    }
  }, []);

  // Listen for polygon data from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent<PostMessage>) => {
      if (event.origin !== window.location.origin) return;

      if (
        event.data?.type === PostMessageType.PolygonViewed ||
        event.data?.type === PostMessageType.PolygonCreated ||
        event.data?.type === PostMessageType.PolygonEdited
      ) {
        setGeoPolygon({
          type: "Polygon",
          coordinates: event.data?.coordinates
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <NextHead>
        <link
          href="https://js.arcgis.com/4.29/esri/themes/dark/main.css"
          rel="stylesheet"
        />
      </NextHead>

      <ArcGISLoader>
        <PolygonEditorMap polygon={geoPolygon} mode={mode} />
      </ArcGISLoader>
    </div>
  );
}
