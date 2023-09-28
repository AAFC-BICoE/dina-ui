import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../components";
import { Organization } from "../../types/agent-api/resources/Organization";
import { OrganizationFields } from "./edit";

export default function OrganizationDetailsPage() {
  return (
    <ViewPageLayout<Organization>
      form={(props) => {
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
            <OrganizationFields />
          </DinaForm>
        );
      }}
      query={(id) => ({ path: `agent-api/organization/${id}` })}
      entityLink="/organization"
      type="organization"
      apiBaseUrl="/agent-api"
      nameField={["names[0].name", "names[1].name"]}
    />
  );
}
