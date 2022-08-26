import { KitsuResource } from "kitsu";

export interface FormTemplate extends KitsuResource {
  type: "form-template";
  createdOn?: string;
  createdBy?: string;
  name?: string;
  group?: string;
  restrictToCreatedBy?: boolean;

  /** This field is JSON with unknown structure, so use Yup or Zod for schema validation / casting. */
  viewConfiguration?: unknown;
}
