import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../components";
import { Group } from "../../types/user-api";
import { GroupFormLayout } from "../../components/group/GroupFormLayout";
import { useDinaIntl } from "../../intl/dina-ui-intl";

export default function GroupDetailsPage() {
  const { locale } = useDinaIntl();
  return (
    <ViewPageLayout<Group>
      form={(props) => (
        <DinaForm<Group>
          {...props}
          initialValues={{
            ...props.initialValues
          }}
        >
          <GroupFormLayout />
        </DinaForm>
      )}
      query={(id) => ({
        path: `user-api/group/${id}`
      })}
      entityLink="/user-api/group"
      type="group"
      apiBaseUrl="/user-api"
      showEditButton={false}
      showDeleteButton={false}
      showGroup={false}
      showBackButton={false}
      nameField={[`labels.${locale}`, "name"]}
      forceTitleUppercase={true}
    />
  );
}
