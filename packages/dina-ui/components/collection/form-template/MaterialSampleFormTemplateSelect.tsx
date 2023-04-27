import { filterBy, ResourceSelect, useAccount } from "common-ui";
import { PersistedResource } from "kitsu";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { FormTemplate } from "../../../types/collection-api";
export interface MaterialSampleFormTemplateSelectProps {
  value?: PersistedResource<FormTemplate>;
  onChange: (newValue: string) => void;
}

export function MaterialSampleFormTemplateSelect({
  onChange,
  value
}: MaterialSampleFormTemplateSelectProps) {
  const { isAdmin, groupNames, username } = useAccount();

  const filterByGroup = filterBy(
    [],
    !isAdmin
      ? {
          extraFilters: [
            // Restrict the list to just the user's groups:
            {
              selector: "group",
              comparison: "=in=",
              arguments: groupNames || []
            }
          ]
        }
      : undefined
  );

  return (
    <label className="d-flex align-items-center gap-2 form-template-select">
      <div className="fw-bold">
        <DinaMessage id="formTemplateSelection" />
      </div>
      <div style={{ width: "20rem" }}>
        <ResourceSelect<FormTemplate>
          filter={(input) => ({
            // Filter by "material-sample-form-section-order" to omit unrelated form-template records:
            "viewConfiguration.type": "material-sample-form-template",
            // Filter by view name typed into the dropdown:
            ...filterBy(["name"])(input),
            // Filter by the groups you are currently in.
            ...filterByGroup("")
          })}
          filterList={(item) =>
            !item?.id ||
            item?.restrictToCreatedBy === false ||
            item?.createdBy === username
          }
          optionLabel={(view) => view.name || view.id}
          model="collection-api/form-template"
          onChange={(selectedFormTemplate) =>
            onChange((selectedFormTemplate as any).id)
          }
          value={value}
        />
      </div>
    </label>
  );
}
