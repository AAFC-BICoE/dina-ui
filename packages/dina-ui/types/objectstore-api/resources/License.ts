import { KitsuResource } from "kitsu";

interface LicenseAttributes {
  url: string;
  titles: Record<string, string>;
}

export type License = KitsuResource & LicenseAttributes;
