import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
  DeleteButton,
  ErrorViewer,
  LoadingSpinner,
  Query,
  safeSubmit,
  SubmitButton,
  TextField
} from "common-ui";
import { Form, Formik } from "formik";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { useContext } from "react";
import { Organization } from "../../types/objectstore-api/resources/Organization";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

interface OrganizationFormProps {
  organization?: Organization;
  router: NextRouter;
}

export function OrganizationEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("editOrganizationTitle")} />
      <Nav />
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>
              <DinaMessage id="editOrganizationTitle" />
            </h1>
            <Query<Organization>
              query={{ path: `agent-api/organization/${id}` }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <OrganizationForm
                      organization={response.data}
                      router={router}
                    />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1>
              <DinaMessage id="addOrganizationTitle" />
            </h1>
            <OrganizationForm router={router} />
          </div>
        )}
      </div>
    </div>
  );
}

function OrganizationForm({ organization, router }: OrganizationFormProps) {
  const { save } = useContext(ApiClientContext);
  const { id } = router.query;
  const initialValues = organization || { type: "organization" };
  const { formatMessage } = useDinaIntl();

  const onSubmit = safeSubmit(async submittedValues => {
    const aliases = submittedValues.aliases;
    if (aliases !== undefined) {
      submittedValues.aliases = aliases.split(",").map(a => a.trim());
    }
    await save(
      [
        {
          resource: submittedValues,
          type: "organization"
        }
      ],
      {
        apiBaseUrl: "/agent-api"
      }
    );

    await router.push(`/organization/list`);
  });

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form translate={undefined}>
        <ErrorViewer />
        <ButtonBar>
          <SubmitButton />
          <CancelButton
            entityId={id as string}
            entityLink="/organization"
            byPassView={true}
          />
          <DeleteButton
            className="ml-5"
            id={id as string}
            options={{ apiBaseUrl: "/agent-api" }}
            postDeleteRedirect="/organization/list"
            type="organization"
          />
        </ButtonBar>
        <div>
          <div className="row">
            <TextField className="col-md-4" name="name" />
          </div>
          <div className="row">
            <TextField
              className="col-md-4"
              name="aliases"
              label={formatMessage("editOrganizationAliasesLabel")}
            />
          </div>
        </div>
      </Form>
    </Formik>
  );
}

export default withRouter(OrganizationEditPage);
