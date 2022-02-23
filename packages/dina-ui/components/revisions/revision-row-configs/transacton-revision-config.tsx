import Link from "next/link";
import { KeyValueTable } from "common-ui";
import { Transaction } from "../../../types/loan-transaction-api";
import { RevisionRowConfig } from "../revision-row-config";
import { ManagedAttributesViewer } from "../../object-store/managed-attributes/ManagedAttributesViewer";

export const TRANSACTION_REVISION_ROW_CONFIG: RevisionRowConfig<Transaction> = {
  name: ({ id, transactionNumber }) => (
    <Link href={`/loan-transaction/transaction/view?id=${id}`}>
      <a>{transactionNumber || id}</a>
    </Link>
  ),
  customValueCells: {
    shipment: ({ original: { value: shipment } }) => (
      <KeyValueTable
        data={shipment}
        customValueCells={{
          address: ({ original: { value: address } }) => (
            <KeyValueTable data={address} />
          )
        }}
      />
    ),
    managedAttributes: ({ original: { value } }) => (
      <ManagedAttributesViewer
        managedAttributeApiPath={key =>
          `collection-api/managed-attribute/${key}`
        }
        values={value}
      />
    )
  }
};
