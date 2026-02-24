import type { GeoPosition } from "./geo.types";

export const PostMessageType = {
  PolygonCreated: "POLYGON_CREATED",
  PolygonEdited: "POLYGON_EDITED",
  PolygonViewed: "POLYGON_VIEWED",
  PopupReady: "POPUP_READY"
} as const;

export type PostMessage =
  | {
      type: typeof PostMessageType.PolygonCreated;
      coordinates: GeoPosition[][];
    }
  | { type: typeof PostMessageType.PolygonEdited; coordinates: GeoPosition[][] }
  | { type: typeof PostMessageType.PolygonViewed; coordinates: GeoPosition[][] }
  | { type: typeof PostMessageType.PopupReady };
