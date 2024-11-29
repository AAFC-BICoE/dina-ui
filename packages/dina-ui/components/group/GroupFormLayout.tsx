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

  // Get pairs of user:agent
  const pairs: Record<string, any> =
    managedBy?.reduce((acc, curr, index) => {
      if (curr.username) {
        acc[curr.username] =
          agentsResp?.dataWithNullForMissing?.[index] && curr.agentId
            ? agentsResp?.data?.[index]
            : {};
      }
      return acc;
    }, {} as { [key: string]: any }) ?? {};

  // For each pair of user:agent, process the agent cell
  const customValueCells =
    managedBy?.reduce((acc, curr) => {
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
    }, {} as { [key: string]: any }) ?? {};

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
                customValueCells={customValueCells}
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
