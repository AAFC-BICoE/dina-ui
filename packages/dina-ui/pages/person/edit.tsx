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
import { Person } from "types/objectstore-api/resources/Person";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

interface PersonFormProps {
  person?: Person;
  router: NextRouter;
}

export function PersonEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("editPersonTitle")} />
      <Nav />
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>
              <DinaMessage id="editPersonTitle" />
            </h1>
            <Query<Person> query={{ path: `agent-api/person/${id}` }}>
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <PersonForm person={response.data} router={router} />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1>
              <DinaMessage id="addPersonTitle" />
            </h1>
            <PersonForm router={router} />
          </div>
        )}
      </div>
    </div>
  );
}

function PersonForm({ person, router }: PersonFormProps) {
  const { save } = useContext(ApiClientContext);
  const { id } = router.query;
  const initialValues = person || { type: "person" };

  const onSubmit = safeSubmit(async submittedValues => {
    await save(
      [
        {
          resource: submittedValues,
          type: "person"
        }
      ],
      {
        apiBaseUrl: "/agent-api"
      }
    );

    await router.push(`/person/list`);
  });

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form>
        <ErrorViewer />
        <ButtonBar>
          <SubmitButton />
          <DeleteButton
            id={id as string}
            options={{ apiBaseUrl: "/agent-api" }}
            postDeleteRedirect="/person/list"
            type="person"
          />
          <CancelButton
            entityId={id as string}
            entityLink="/person"
            byPassView={true}
          />
        </ButtonBar>
        <div>
          <div className="row">
            <TextField className="col-md-4" name="displayName" />
          </div>
          <div className="row">
            <TextField className="col-md-4" name="email" />
          </div>
        </div>
      </Form>
    </Formik>
  );
}

export default withRouter(PersonEditPage);
