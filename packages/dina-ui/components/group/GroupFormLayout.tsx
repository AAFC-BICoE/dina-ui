import {
  useDinaFormContext,
  TextField,
  MultilingualTitle,
  MultilingualDescription,
  CustomQueryPageView,
  KeyValueTable
} from "packages/common-ui/lib";
import { useDinaIntl, DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { GroupSelectField } from "../group-select/GroupSelectField";
import { ManagedAttributesEditor } from "../managed-attributes/ManagedAttributesEditor";
import { AttachmentsField } from "../object-store/attachment-list/AttachmentsField";
import { useRouter } from "next/router";
import { GroupLabel } from "../group-select/GroupFieldView";

export function GroupFormLayout() {
  const { initialValues } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const stringRolesPerGroup: Record<string, string> = {};
  const rolesPerGroup: Record<string, string[] | undefined> = {};
  for (const key in rolesPerGroup) {
    if (key) {
      stringRolesPerGroup[key] = rolesPerGroup[key]?.join(", ") ?? "";
    }
  }

  return (
    <div>
      <div className="row">
        <div className="col-md-6 name">
          {" "}
          <KeyValueTable
            data={stringRolesPerGroup}
            attributeCell={({
              row: {
                original: { field }
              }
            }) => (
              <strong>
                <GroupLabel groupName={field} />
              </strong>
            )}
            attributeHeader={<DinaMessage id="managedBy" />}
            valueHeader={<DinaMessage id="agent" />}
          />
        </div>
      </div>
    </div>
  );
}
