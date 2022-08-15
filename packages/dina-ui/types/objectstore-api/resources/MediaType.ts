import { KitsuResource } from "kitsu";

export interface MediaTypeAttributes {
  type: "media-type";
  mediaType: string;
}

export type MediaType = KitsuResource & MediaTypeAttributes;
