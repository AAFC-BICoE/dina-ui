import {
  ButtonBar,
  CancelButton,
  FieldView,
  LoadingSpinner,
  Query,
  useAccount
} from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { DinaUser } from "../../types/objectstore-api/resources/DinaUser";

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
      <Query<DinaUser> query={{ path: `dinauser-api/user/${subject}` }}>
        {({ loading, response }) => {
          const dinaUser = response && {
            ...response.data
          };

          return (
            <div className="container-fluid">
              <h1>
                <DinaMessage id="whoAmITitle" />
              </h1>
              <LoadingSpinner loading={loading} />
              {dinaUser && (
                <Formik<DinaUser> initialValues={dinaUser} onSubmit={noop}>
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
                </Formik>
              )}
            </div>
          );
        }}
      </Query>
      <Footer />
    </div>
  );
}
