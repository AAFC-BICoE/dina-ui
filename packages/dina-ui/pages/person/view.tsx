import { DinaForm, FieldView } from "common-ui";
import { PersonFormFields } from "../../../dina-ui/components/add-person/PersonFormFields";
import { ViewPageLayout } from "../../components";
import { Person } from "../../types/agent-api/resources/Person";

export default function PersonDetailsPage() {
  return (
    <ViewPageLayout<Person>
      form={(props) => {
        const person = props.initialValues;

        if (person.createdOn) {
          const inUserTimeZone = new Date(person.createdOn).toString();
          person.createdOn = inUserTimeZone;
        }

        return (
          <DinaForm<Person> {...props} initialValues={person}>
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
              <PersonFormFields divClassName="row" fieldClassName="col-md-4" />
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
        );
      }}
      query={(id) => ({
        path: `agent-api/person/${id}?include=organizations,identifiers`
      })}
      entityLink="/person"
      type="person"
      apiBaseUrl="/agent-api"
      nameField="displayName"
    />
  );
}
