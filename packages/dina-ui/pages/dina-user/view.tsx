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
      <Query<DinaUser> query={{ path: `user-api/user/${subject}` }}>
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
                    <div className="row">
                      <FieldView className="col-md-2" name="username" />
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
