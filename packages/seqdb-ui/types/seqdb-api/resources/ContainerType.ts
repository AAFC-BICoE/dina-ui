import { KitsuResource } from "kitsu";
import { Group } from "./Group";

export interface ContainerTypeAttributes {
  baseType: string;
  lastModified?: string;
  name: string;
  numberOfColumns: number;
  numberOfRows: number;
  numberOfWells: number;
}

export interface ContainerTypeRelationships {
  group?: Group;
}

export type ContainerType = KitsuResource &
  ContainerTypeAttributes &
  ContainerTypeRelationships;
