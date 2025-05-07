import {
  KeyValueTable,
  useQuery,
  withResponse,
  useBulkGet
} from "../../../common-ui/lib";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import { useRouter } from "next/router";
import { GroupMembership } from "../../../dina-ui/types/user-api/resources/GroupMembership";
import Link from "next/link";
import { Person } from "../../../dina-ui/types/agent-api";

export function GroupFormLayout() {
  const router = useRouter();
  const id = String(router?.query?.id);

  const query = useQuery<GroupMembership>({
    path: `user-api/group-membership/${id}`
  });

  const managedBy = query?.response?.data.managedBy ?? [];

  // Get the users with defined agentId and remember their index
  const managedByWithAgent = managedBy
    .map((item, index) => (item.agentId ? { item, index } : null))
    .filter(Boolean) as { item: (typeof managedBy)[number]; index: number }[];

  const agentsResp = useBulkGet<Person>({
    ids: managedByWithAgent.map(({ item }) => String(item.agentId)),
    listPath: "agent-api/person"
  });

  // Build a map from original index to agent
  const agentByIndex = new Map<number, Person>();
  managedByWithAgent.forEach(({ index }, i) => {
    const agent = agentsResp?.dataWithNullForMissing?.[i];
    if (agent) {
      agentByIndex.set(index, agent);
    }
  });

  // Build the full key-value pairs with agent data if available
  const pairs = managedBy.reduce((acc, curr, index) => {
    if (curr.username) {
      acc[curr.username] = agentByIndex.get(index) ?? {};
    }
    return acc;
  }, {} as Record<string, any>);

  // Build custom value cells for each username
  const customValueCells = managedBy.reduce((acc, curr) => {
    if (curr.username) {
      acc[curr.username] = ({ row: { original } }) => {
        return original?.value?.id ? (
          <Link href={`/person/view?id=${original?.value?.id}`}>
            {original?.value?.displayName}
          </Link>
        ) : (
          <></>
        );
      };
    }
    return acc;
  }, {} as Record<string, any>);

  return (
    <div>
      <div className="row">
        <div className="col-md-6 name">
          {withResponse(query, ({}) => (
            <KeyValueTable
              data={pairs}
              attributeCell={({ row: { original } }) => (
                <strong>{original.field}</strong>
              )}
              customValueCells={customValueCells}
              attributeHeader={<DinaMessage id="managedBy" />}
              valueHeader={<DinaMessage id="associatedAgent" />}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
