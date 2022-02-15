import { KitsuResource } from "kitsu";

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
  shipment?: Shipment;
  createdBy?: string;
  createdOn?: string;
}

export interface Shipment {
  contentRemarks?: string;
  value?: string; // Number stored as string.
  currency?: string;
  itemCount?: number;
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

export type Transaction = KitsuResource & TransactionAttributes;
