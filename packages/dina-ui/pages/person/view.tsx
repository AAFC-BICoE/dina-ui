import {
  ButtonBar,
  BackButton,
  DinaForm,
  EditButton,
  FieldView,
  LoadingSpinner,
  Query
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { PersonFormFields } from "../../../dina-ui/components/add-person/PersonFormFields";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/agent-api/resources/Person";

export function PersonDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  const buttonBar = (
    <ButtonBar>
      <EditButton entityId={id as string} entityLink="person" />
      <BackButton
        entityId={id as string}
        entityLink="/person"
        byPassView={true}
      />
    </ButtonBar>
  );

  return (
    <div>
      <Head
        title={formatMessage("personViewTitle")}
        lang={formatMessage("languageOfPage")}
        creator={formatMessage("agricultureCanada")}
        subject={formatMessage("subjectTermsForPage")}
      />
      <Nav />
      <Query<Person>
        query={{ path: `agent-api/person/${id}?include=organizations` }}
      >
        {({ loading, response }) => {
          const person = response && {
            ...response.data
          };

          if (person && person.createdOn) {
            const inUserTimeZone = new Date(person.createdOn).toString();
            person.createdOn = inUserTimeZone;
          }

          return (
            <main className="container-fluid">
              {buttonBar}
              <h1 id="wb-cont">
                <DinaMessage id="personViewTitle" />
              </h1>
              <LoadingSpinner loading={loading} />
              {person && (
                <DinaForm<Person> initialValues={person} readOnly={true}>
                  <div className="row">
                    <FieldView className="col-md-2" name="displayName" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="givenNames" />
                    <FieldView className="col-md-2" name="familyNames" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="aliases" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="email" />
                    <FieldView className="col-md-2" name="organizations" />
                  </div>
                  {!!person?.identifiers?.length && (
                    <PersonFormFields
                      divClassName="row"
                      fieldClassName="col-md-4"
                    />
                  )}
                  <div className="row">
                    <FieldView className="col-md-2" name="webpage" />
                    <FieldView className="col-md-2" name="remarks" />
                  </div>
                  <div className="row">
                    <FieldView className="col-md-2" name="createdBy" />
                    <FieldView className="col-md-2" name="createdOn" />
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

export default withRouter(PersonDetailsPage);
