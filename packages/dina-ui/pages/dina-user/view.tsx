import {
  ButtonBar,
  BackButton,
  DinaForm,
  FieldView,
  KeyValueTable,
  useAccount,
  useQuery,
  withResponse
} from "common-ui";
import { Footer, GroupLabel, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { DinaUser } from "../../types/user-api/resources/DinaUser";

export default function DinaUserDetailsPage() {
  const { subject } = useAccount();
  const { formatMessage } = useDinaIntl();

  const userQuery = useQuery<DinaUser>(
    { path: `user-api/user/${subject}` },
    {
      joinSpecs: [
        {
          apiBaseUrl: "/agent-api",
          idField: "agentId",
          joinField: "agent",
          path: user => `person/${user.agentId}?include=organizations`
        }
      ]
    }
  );

  return (
    <div>
      <Head title={formatMessage("whoAmITitle")} />
      <Nav />
      <ButtonBar>
        <BackButton entityLink="/user" navigateTo={`/`} />
      </ButtonBar>
      {withResponse(userQuery, ({ data: dinaUser }) => (
        <main className="container-fluid">
          <h1>
            <DinaMessage id="whoAmITitle" />
          </h1>
          <DinaForm<DinaUser> initialValues={dinaUser}>
            <div>
              <div className="form-group">
                <div className="row">
                  <FieldView className="col-md-2" name="username" />
                  <FieldView className="col-md-2" name="groups" />
                  <FieldView className="col-md-2" name="roles" />
                  <FieldView
                    className="col-md-2"
                    label={formatMessage("associatedAgent")}
                    name="agent.displayName"
                    link={
                      dinaUser.agentId
                        ? `/person/view?id=${dinaUser.agentId}`
                        : ""
                    }
                  />
                </div>
                <div className="row">
                  <div className="col-4">
                    <RolesPerGroupTable
                      rolesPerGroup={dinaUser.rolesPerGroup}
                    />
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

interface RolesPerGroupTableProps {
  rolesPerGroup: Record<string, string[] | undefined>;
}

function RolesPerGroupTable({ rolesPerGroup }: RolesPerGroupTableProps) {
  // Convert the rolesPerGroup to an object with comma-separated strings instead of arrays:
  const stringRolesPerGroup: Record<string, string> = {};
  // tslint:disable-next-line
  for (const key in rolesPerGroup) {
    stringRolesPerGroup[key] = rolesPerGroup[key]?.join(", ") ?? "";
  }

  return (
    <div>
      <h2>
        <DinaMessage id="rolesPerGroup" />
      </h2>
      <KeyValueTable
        data={stringRolesPerGroup}
        attributeCell={({ original: { field } }) => (
          <strong>
            <GroupLabel groupName={field} />
          </strong>
        )}
        attributeHeader={<DinaMessage id="group" />}
        valueHeader={<DinaMessage id="roles" />}
      />
    </div>
  );
}
