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
import { useRouter, NextRouter } from "next/router";
import { useContext } from "react";
import {
  MultiligualName,
  Organization
} from "../../types/objectstore-api/resources/Organization";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

interface OrganizationFormProps {
  organization?: Organization;
  router: NextRouter;
}

export default function OrganizationEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
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
    if (submittedValues.name !== undefined) {
      const multiligualName: MultiligualName = {
        languageCode:
          submittedValues.names[0].languageCode === "FR" ? "EN" : "FR",
        name: submittedValues.name
      };
      submittedValues.names.push(multiligualName);
      delete submittedValues.name;
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

  const orgName1 = organization?.names[0];
  const orgName2 = organization?.names[1];
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
          {organization?.names.length === 2 ? (
            <>
              <div className="row">
                <TextField
                  className="col-md-4 name1"
                  name="names[0].name"
                  label={
                    orgName1?.languageCode === "EN"
                      ? formatMessage("organizationEnglishNameLabel")
                      : formatMessage("organizationFrenchNameLabel")
                  }
                />
              </div>
              <div className="row">
                <TextField
                  className="col-md-4 name2"
                  name="names[1].name"
                  label={
                    orgName2?.languageCode === "EN"
                      ? formatMessage("organizationEnglishNameLabel")
                      : formatMessage("organizationFrenchNameLabel")
                  }
                />
              </div>
            </>
          ) : orgName1?.languageCode === "FR" ? (
            <>
              <div className="row">
                <TextField
                  className="col-md-4 name1"
                  name="names[0].name"
                  label={formatMessage("organizationFrenchNameLabel")}
                />
              </div>
              <div className="row">
                <TextField
                  className="col-md-4 name2"
                  name="name"
                  label={formatMessage("organizationEnglishNameLabel")}
                />
              </div>
            </>
          ) : (
            <>
              <div className="row">
                <TextField
                  className="col-md-4 name1"
                  name="names[0].name"
                  label={formatMessage("organizationEnglishNameLabel")}
                />
              </div>
              <div className="row">
                <TextField
                  className="col-md-4 name2"
                  name="name"
                  label={formatMessage("organizationFrenchNameLabel")}
                />
              </div>
            </>
          )}
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
