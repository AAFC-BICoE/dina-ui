import {
  KeyValueTable,
  useQuery,
  withResponse,
  useBulkGet
} from "packages/common-ui/lib";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useRouter } from "next/router";
import { GroupMembership } from "packages/dina-ui/types/user-api/resources/GroupMembership";
import Link from "next/link";
import { Person } from "packages/dina-ui/types/agent-api";

export function GroupFormLayout() {
  const router = useRouter();
  const id = String(router?.query?.id);

  // Get super users of the group
  const query = useQuery<GroupMembership>({
    path: `user-api/group-membership/${id}`
  });
  const managedBy = query?.response?.data.managedBy;

  // Try to get associated agents for users.
  const agentsResp = useBulkGet<Person>({
    ids: managedBy?.map((it) => String(it.agentId)) ?? [],
    listPath: "agent-api/person"
  });
  const pairs: Record<string, string> =
    managedBy?.reduce((acc, curr, index) => {
      if (curr.username) {
        acc[curr.username] =
          agentsResp?.dataWithNullForMissing?.[index] && curr.agentId
            ? curr.agentId
            : "";
      }
      return acc;
    }, {} as { [key: string]: string }) ?? {};

  return (
    <div>
      <div className="row">
        <div className="col-md-6 name">
          {withResponse(query, ({}) => {
            return (
              <KeyValueTable
                data={pairs}
                attributeCell={({ row: { original } }) => {
                  return <strong>{original.field}</strong>;
                }}
                customValueCells={{
                  agentId: ({ row: { original } }) => {
                    return (
                      <strong>
                        <Link href={`/person/view?id=/${original.value}`}>
                          <DinaMessage id="agentLink" />
                        </Link>
                      </strong>
                    );
                  }
                }}
                attributeHeader={<DinaMessage id="managedBy" />}
                valueHeader={<DinaMessage id="associatedAgent" />}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
