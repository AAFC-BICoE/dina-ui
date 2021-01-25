import { KitsuResource } from "kitsu";

export interface ContainerTypeAttributes {
  baseType: string;
  group?: string;
  lastModified?: string;
  name: string;
  numberOfColumns: number;
  numberOfRows: number;
}

export type ContainerType = KitsuResource & ContainerTypeAttributes;
