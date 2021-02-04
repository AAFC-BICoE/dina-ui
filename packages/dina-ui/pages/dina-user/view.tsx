import {
  ButtonBar,
  CancelButton,
  DinaForm,
  FieldView,
  LoadingSpinner,
  Query,
  useAccount
} from "common-ui";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { DinaUser } from "../../types/user-api/resources/DinaUser";

export default function DinaUserDetailsPage() {
  const { subject } = useAccount();

  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("whoAmITitle")} />
      <Nav />
      <ButtonBar>
        <CancelButton entityLink="/user" navigateTo={`/`} />
      </ButtonBar>
      <Query<DinaUser>
        query={{ path: `user-api/user/${subject}` }}
        options={{
          joinSpecs: [
            {
              apiBaseUrl: "/agent-api",
              idField: "agentId",
              joinField: "agent",
              path: user => `person/${user.agentId}?include=organizations`
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
                <DinaMessage id="whoAmITitle" />
              </h1>
              <LoadingSpinner loading={loading} />
              {dinaUser && (
                <DinaForm<DinaUser> initialValues={dinaUser}>
                  <div>
                    <div className="form-group">
                      <div className="row">
                        <FieldView className="col-md-2" name="username" />
                        <FieldView className="col-md-2" name="groups" />
                        <FieldView className="col-md-2" name="roles" />
                        <FieldView className="col-md-2" name="firstName" />
                        <FieldView className="col-md-2" name="lastName" />
                        <FieldView className="col-md-2" name="emailAddress" />
                      </div>
                    </div>
                    <div className="form-group">
                      <h2>
                        <DinaMessage id="personViewTitle" />
                      </h2>
                      <div className="row">
                        <FieldView
                          className="col-md-2"
                          name="agent.displayName"
                          link={
                            dinaUser.agentId
                              ? `/person/view?id=${dinaUser.agentId}`
                              : ""
                          }
                        />
                        <FieldView
                          className="col-md-2"
                          name="agent.givenNames"
                        />
                        <FieldView
                          className="col-md-2"
                          name="agent.familyNames"
                        />
                        <FieldView className="col-md-2" name="agent.email" />
                        <FieldView
                          className="col-md-2"
                          name="agent.organizations"
                        />
                        <FieldView
                          className="col-md-2"
                          name="agent.createdBy"
                        />
                        <FieldView
                          className="col-md-2"
                          name="agent.createdOn"
                        />
                      </div>
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
