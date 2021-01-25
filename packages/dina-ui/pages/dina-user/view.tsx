import {
  ButtonBar,
  CancelButton,
  DinaForm,
  EditButton,
  FieldView,
  LoadingSpinner,
  Query
} from "common-ui";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";
import { DinaUser } from "../../types/objectstore-api/resources/DinaUser";

/** DinaUser with client-side-joined Agent. */
interface DinaUserWithAgent extends DinaUser {
  agent?: Person;
}

export default function DinaUserDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("userViewTitle")} />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="dina-user" />
        <CancelButton entityLink="/dina-user" navigateTo={`/`} />
      </ButtonBar>
      <Query<DinaUserWithAgent>
        query={{ path: `user-api/user/${id}` }}
        options={{
          joinSpecs: [
            {
              apiBaseUrl: "/agent-api",
              idField: "agentId",
              joinField: "agent",
              path: user => `person/${user.agentId}`
            }
          ]
        }}
      >
        {({ loading, response }) => {
          const dinaUser = response && {
            ...response.data
          };

          return (
            <main className="container-fluid">
              <h1>
                <DinaMessage id="userViewTitle" />
              </h1>
              <LoadingSpinner loading={loading} />
              {dinaUser && (
                <DinaForm<DinaUser> initialValues={dinaUser}>
                  <div>
                    <div className="row">
                      <FieldView className="col-md-2" name="username" />
                      <FieldView
                        className="col-md-2"
                        name="agent.displayName"
                        link={`/person/view?id=${dinaUser.agent?.id}`}
                      />
                      <FieldView className="col-md-2" name="groups" />
                      <FieldView className="col-md-2" name="roles" />
                      <FieldView className="col-md-2" name="firstName" />
                      <FieldView className="col-md-2" name="lastName" />
                      <FieldView className="col-md-2" name="emailAddress" />
                    </div>
                  </div>
                </DinaForm>
              )}
            </main>
          );
        }}
      </Query>
      <Footer />
    </div>
  );
}
