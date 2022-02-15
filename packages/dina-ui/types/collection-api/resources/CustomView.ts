import { KitsuResource } from "kitsu";

export interface CustomViewAttributes {
  type: "custom-view";
  createdOn?: string;
  createdBy?: string;
  name?: string;
  group?: string;
  restrictToCreatedBy?: boolean;

  /** This field is JSON with unknown structure, so use Yup for schema validation / casting. */
  viewConfiguration?: unknown;
}

export type CustomView = KitsuResource & CustomViewAttributes;
