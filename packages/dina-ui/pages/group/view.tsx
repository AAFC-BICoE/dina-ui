import { DinaForm, Tooltip } from "common-ui";
import { fromPairs } from "lodash";
import { ViewPageLayout } from "packages/dina-ui/components";
import { Group } from "packages/dina-ui/types/user-api";
import { GroupFormLayout } from "packages/dina-ui/components/group/GroupFormLayout";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";

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
      nameField={`labels.${locale}`}
    />
  );
}
