import {
  ButtonBar,
  CancelButton,
  EditButton,
  FieldView,
  LoadingSpinner,
  Query
} from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api/resources/Person";

export function PersonDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("personViewTitle")} />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="person" />
        <CancelButton
          entityId={id as string}
          entityLink="/person"
          byPassView={true}
        />
      </ButtonBar>
      <Query<Person> query={{ path: `agent-api/person/${id}` }}>
        {({ loading, response }) => {
          const person = response && {
            ...response.data
          };

          if (person && person.createdOn) {
            const inUserTimeZone = new Date(person.createdOn).toString();
            person.createdOn = inUserTimeZone;
          }

          return (
            <div className="container-fluid">
              <h1>
                <DinaMessage id="personViewTitle" />
              </h1>
              <LoadingSpinner loading={loading} />
              {person && (
                <Formik<Person> initialValues={person} onSubmit={noop}>
                  <div>
                    <div className="row">
                      <FieldView className="col-md-2" name="displayName" />
                      <FieldView className="col-md-2" name="email" />
                      <FieldView
                        className="col-md-2"
                        name="organization.name"
                      />
                      <FieldView className="col-md-2" name="createdBy" />
                      <FieldView className="col-md-2" name="createdOn" />
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

export default withRouter(PersonDetailsPage);
