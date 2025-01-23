import { DinaForm } from "common-ui";
import { ViewPageLayout } from "../../components";
import { GroupFormLayout } from "../../components/group/GroupFormLayout";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Group } from "../../types/user-api";

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
      entityLink="/group"
      type="group"
      apiBaseUrl="/user-api"
      showEditButton={false}
      showDeleteButton={false}
      showGroup={false}
      showBackButton={true}
      nameField={[`labels.${locale}`, "name"]}
      forceTitleUppercase={true}
    />
  );
}
