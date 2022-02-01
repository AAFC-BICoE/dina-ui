import { KitsuResource } from "kitsu";

export interface TransactionAttributes {
  type: "transaction";

  transactionNumber?: string;
  direction?: string;
  toBeReturned?: string;
  transactionType?: string;
  otherIdentifiers?: string;
  transactionStatus?: string;
  purposeOfTransaction?: string;

  dateOpened?: string;
  dateClosed?: string;
  dateDue?: string;
}

export interface TransactionRelationships {
  createdBy?: string;
}

export type Transaction = KitsuResource &
  TransactionAttributes &
  TransactionRelationships;
