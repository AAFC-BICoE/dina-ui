import Link from "next/link";
import { KeyValueTable } from "common-ui";
import { Transaction } from "../../../types/loan-transaction-api";
import { RevisionRowConfig } from "../revision-row-config";
import { ManagedAttributesViewer } from "../../managed-attributes/ManagedAttributesViewer";
import { ReferenceLink } from "../ReferenceLink";
import { Person } from "../../../types/objectstore-api";

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
        values={value}
        managedAttributeApiPath="loan-transaction-api/managed-attribute"
      />
    ),
    // Computed value; don't show audits.
    involvedAgents: () => null,
    agentRoles: ({ original: { value: agentRoles } }) => (
      <div>
        {agentRoles?.map((agentRole, index) => (
          <KeyValueTable
            key={index}
            data={agentRole}
            customValueCells={{
              agent: ({ original: { value: personUuid } }) => (
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
