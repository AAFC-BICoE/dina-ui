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
import { Organization } from "../../types/objectstore-api/resources/Organization";

export function OrganizationDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("organizationViewTitle")} />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="organization" />
        <CancelButton
          entityId={id as string}
          entityLink="/organization"
          byPassView={true}
        />
      </ButtonBar>
      <Query<Organization>
        query={{ path: `agent-api/organization/${id}?include=organizations` }}
      >
        {({ loading, response }) => {
          const organization = response && {
            ...response.data
          };

          if (organization && organization.createdOn) {
            const inUserTimeZone = new Date(organization.createdOn).toString();
            organization.createdOn = inUserTimeZone;
          }

          return (
            <div className="container-fluid">
              <h1>
                <DinaMessage id="organizationViewTitle" />
              </h1>
              <LoadingSpinner loading={loading} />
              {organization && (
                <Formik<Organization>
                  initialValues={organization}
                  onSubmit={noop}
                >
                  <div>
                    <div className="row">
                      <FieldView className="col-md-2" name="name" />
                      <FieldView className="col-md-3" name="aliases" />
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

export default withRouter(OrganizationDetailsPage);
