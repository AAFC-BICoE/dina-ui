import {
  BackButton,
  ButtonBar,
  DataExportListPageLayout,
  DinaForm,
  EditButton,
  FieldView,
  KeyValueTable,
  ReactTable,
  ReadOnlyValue,
  useAccount,
  useQuery,
  withResponse
} from "common-ui";
import { useRouter } from "next/router";
import { SUPER_USER } from "common-ui/types/DinaRoles";
import { Footer, GroupLabel, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";
import { DinaUser } from "../../types/user-api/resources/DinaUser";
import classNames from "classnames";

export default function DinaUserDetailsPage() {
  const router = useRouter();
  const { isAdmin, rolesPerGroup, subject } = useAccount();

  // Get the user ID from the URL, otherwise use the current user:
  const id = router.query.id?.toString() ?? subject;
  const hideBackButton = router.query.hideBackButton === "true";

  const { formatMessage } = useDinaIntl();

  const userQuery = useQuery<DinaUser & { agent?: Person }>(
    { path: `user-api/user/${id}` },
    {
      joinSpecs: [
        {
          apiBaseUrl: "/agent-api",
          idField: "agentId",
          joinField: "agent",
          path: (user) => `person/${user.agentId}?include=organizations`
        }
      ]
    }
  );

  // Editable if current user is dina-admin, or a collection manager of any group:
  const currentUserCanEdit =
    Object.values(rolesPerGroup ?? {})
      ?.flatMap((it) => it)
      ?.includes(SUPER_USER) || isAdmin;

  return (
    <div>
      <Head title={formatMessage("userViewTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="col-md-6 col-sm-12 mt-2">
          {!hideBackButton && (
            <BackButton entityLink="/dina-user" className="mt-2" />
          )}
        </div>
        {currentUserCanEdit && (
          <div className="col-md-6 col-sm-12 d-flex">
            <EditButton
              className="ms-auto"
              entityId={id as string}
              entityLink="dina-user"
            />
          </div>
        )}
      </ButtonBar>
      {withResponse(userQuery, ({ data: dinaUser }) => (
        <main className="container-fluid">
          <h1 id="wb-cont">
            <DinaMessage id={"userViewTitle"} />
          </h1>
          <DinaForm<DinaUser> initialValues={dinaUser}>
            <div>
              <div className="mb-3">
                <div className="row">
                  <FieldView className="col-md-3" name="username" />
                  <FieldView
                    className="col-md-3"
                    name="agent.displayName"
                    label={formatMessage("associatedAgent")}
                    link={`/person/view?id=${dinaUser.agent?.id}`}
                  />
                </div>
                <div className="row">
                  <div className="col-4">
                    <AdminRolesTable adminRoles={dinaUser.adminRoles} />
                  </div>
                </div>
                <div className="row">
                  <div className="col-4">
                    <RolesPerGroupTable
                      rolesPerGroup={dinaUser.rolesPerGroup}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div>
                    <h2>
                      <DinaMessage id="dataExports" />
                    </h2>
                    <DataExportListPageLayout username={dinaUser.username} />
                  </div>
                </div>
              </div>
            </div>
          </DinaForm>
        </main>
      ))}
      <Footer />
    </div>
  );
}

export interface RolesPerGroupTableProps {
  rolesPerGroup: Record<string, string[] | undefined>;
  hideTitle?: boolean;
  hideTable?: boolean;
}

export function RolesPerGroupTable({
  rolesPerGroup,
  hideTitle,
  hideTable
}: RolesPerGroupTableProps) {
  // Convert the rolesPerGroup to an object with comma-separated strings instead of arrays:
  const stringRolesPerGroup: Record<string, string> = {};
  for (const key in rolesPerGroup) {
    stringRolesPerGroup[key] = rolesPerGroup[key]?.join(", ") ?? "";
  }

  return (
    <div>
      {!hideTitle && (
        <h2>
          <DinaMessage id="rolesPerGroup" />
        </h2>
      )}
      {!hideTable && (
        <KeyValueTable
          data={stringRolesPerGroup}
          attributeCell={({
            row: {
              original: { field }
            }
          }) => (
            <strong>
              <GroupLabel groupName={field} />
            </strong>
          )}
          attributeHeader={<DinaMessage id="group" />}
          valueHeader={<DinaMessage id="role" />}
        />
      )}
    </div>
  );
}

export interface AdminRolesTableProps {
  adminRoles: string[];
  hideTitle?: boolean;
  hideTable?: boolean;
}

export function AdminRolesTable({
  adminRoles,
  hideTitle,
  hideTable
}: AdminRolesTableProps) {
  return (
    <div className="mb-3">
      {!hideTitle && (
        <h2>
          <DinaMessage id="adminRoles" />
        </h2>
      )}
      {!hideTable && (
        <ReactTable
          className={classNames("-striped")}
          highlightRow={false}
          columns={[
            // Render the value as a string, or the custom cell component if one is defined:
            {
              cell: ({ row: { original } }) => {
                return <ReadOnlyValue value={original} />;
              },
              header: () => <DinaMessage id="roles" />,
              accessorKey: "adminRoles"
            }
          ]}
          data={adminRoles}
          showPagination={false}
          manualPagination={true}
        />
      )}
    </div>
  );
}
