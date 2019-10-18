import { KitsuResource } from "kitsu";
import { ContainerType } from "./ContainerType";
import { Group } from "./Group";

export interface ContainerAttributes {
  containerNumber: string;
  fillByRow: boolean;
  lastModified?: string;
}

export interface ContainerRelationships {
  containerType: ContainerType;
  group?: Group;
}

export type Container = KitsuResource &
  ContainerAttributes &
  ContainerRelationships;
