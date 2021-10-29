import { DinaForm, FieldView } from "common-ui";
import { ViewPageLayout } from "../../components";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Organization } from "../../types/agent-api/resources/Organization";

export default function OrganizationDetailsPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <ViewPageLayout<Organization>
      form={props => {
        const organization = props.initialValues;

        if (organization && organization.createdOn) {
          const inUserTimeZone = new Date(organization.createdOn).toString();
          organization.createdOn = inUserTimeZone;
        }

        if (organization) {
          organization.name = new Map();
          organization.name[organization.names[0].languageCode] =
            organization.names[0].name;
          organization.name[organization.names[1]?.languageCode] =
            organization.names[1]?.name;
        }

        return (
          <DinaForm<Organization> {...props} initialValues={organization}>
            <div className="row">
              <FieldView
                className="col-md-2"
                name="name.EN"
                label={formatMessage("organizationEnglishNameLabel")}
              />
              <FieldView
                className="col-md-2"
                name="name.FR"
                label={formatMessage("organizationFrenchNameLabel")}
              />
              <FieldView className="col-md-3" name="aliases" />
              <FieldView className="col-md-2" name="createdBy" />
              <FieldView className="col-md-2" name="createdOn" />
            </div>
          </DinaForm>
        );
      }}
      query={id => ({ path: `agent-api/organization/${id}` })}
      entityLink="/organization"
      type="organization"
      apiBaseUrl="/agent-api"
      nameField={["name.EN", "name.FR"]}
      deleteButton={() => null}
    />
  );
}
