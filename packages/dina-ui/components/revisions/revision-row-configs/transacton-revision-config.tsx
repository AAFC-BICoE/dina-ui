import { KeyValueTable } from "common-ui";
import Link from "next/link";
import { Transaction } from "../../../types/loan-transaction-api";
import { Person } from "../../../types/objectstore-api";
import { ManagedAttributesViewer } from "../../managed-attributes/ManagedAttributesViewer";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const TRANSACTION_REVISION_ROW_CONFIG: RevisionRowConfig<Transaction> = {
  name: ({ id, transactionNumber }) => (
    <Link href={`/loan-transaction/transaction/view?id=${id}`}>
      {transactionNumber || id}
    </Link>
  ),
  customValueCells: {
    shipment: ({
      row: {
        original: { value: shipment }
      }
    }) => (
      <KeyValueTable
        data={shipment}
        customValueCells={{
          address: ({
            row: {
              original: { value: address }
            }
          }) => <KeyValueTable data={address} />
        }}
      />
    ),
    managedAttributes: ({
      row: {
        original: { value }
      }
    }) => (
      <ManagedAttributesViewer
        values={value}
        managedAttributeApiPath="loan-transaction-api/managed-attribute"
      />
    ),
    // Computed value; don't show audits.
    involvedAgents: () => null,
    agentRoles: ({
      row: {
        original: { value: agentRoles }
      }
    }) => (
      <div>
        {agentRoles?.map((agentRole, index) => (
          <KeyValueTable
            key={index}
            data={agentRole}
            customValueCells={{
              agent: ({
                row: {
                  original: { value: personUuid }
                }
              }) => (
                <ReferenceLink<Person>
                  type="person"
                  baseApiPath="agent-api"
                  reference={{ id: personUuid, type: "person" }}
                  name={(person) => person.displayName ?? person.id}
                  href="/person/view?id="
                />
              )
            }}
          />
        ))}
      </div>
    )
  }
};
