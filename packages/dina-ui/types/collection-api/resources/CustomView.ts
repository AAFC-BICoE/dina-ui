import { KitsuResource } from "kitsu";

export interface CustomView extends KitsuResource {
  type: "custom-view";
  createdOn?: string;
  createdBy?: string;
  name?: string;
  group?: string;
  restrictToCreatedBy?: boolean;

  /** This field is JSON with unknown structure, so use Yup or Zod for schema validation / casting. */
  viewConfiguration?: unknown;
}
