import { ResourceIdentifierObject } from "jsonapi-typescript";
import { KitsuResource } from "kitsu";
import { Person } from "../../objectstore-api";

export interface TransactionAttributes {
  type: "transaction";

  group?: string;
  materialDirection?: string;
  transactionNumber?: string;
  otherIdentifiers?: string[];
  materialToBeReturned?: boolean;
  purpose?: string;
  transactionType?: string;
  status?: string;
  openedDate?: string;
  closedDate?: string;
  dueDate?: string;
  remarks?: string;
  agentRoles?: AgentRole[];
  shipment?: Shipment;
  createdBy?: string;
  createdOn?: string;
}

export interface TransactionRelationships {
  attachment?: ResourceIdentifierObject[];
  materialSamples?: ResourceIdentifierObject[];
}

export interface Shipment {
  contentRemarks?: string;
  value?: string; // Number stored as string.
  currency?: string;
  itemCount?: number | string;
  shippedOn?: string;
  status?: string;
  packingMethod?: string;
  trackingNumber?: string;
  address?: ShipmentAddress;
  shipmentRemarks?: string;
}

export interface ShipmentAddress {
  receiverName?: string;
  companyName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  provinceState?: string;
  zipCode?: string;
  country?: string;
}

export interface AgentRole {
  // "agent" should be converted to a Person on the front-end, but submitted to the back-end as a UUID:
  agent?: string | Person | null;
  roles?: string[];
  date?: string;
  remarks?: string;
}

export type Transaction = KitsuResource &
  TransactionRelationships &
  TransactionAttributes;
