import { FieldSpy, filterBy, ResourceSelect } from "common-ui";
import { PersistedResource } from "kitsu";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { FormTemplate } from "../../../types/collection-api";

export interface MaterialSampleFormTemplateSelectProps {
  value?: PersistedResource<FormTemplate>;
  onChange: (newValue: PersistedResource<FormTemplate>) => void;
}

export function MaterialSampleFormTemplateSelect({
  onChange,
  value
}: MaterialSampleFormTemplateSelectProps) {
  return (
    <label className="d-flex align-items-center gap-2 form-template-select">
      <div className="fw-bold">
        <DinaMessage id="formTemplateSelection" />
      </div>
      <div style={{ width: "20rem" }}>
        <FieldSpy<string> fieldName="group">
          {group => (
            <ResourceSelect<FormTemplate>
              filter={input => ({
                // Filter by "material-sample-form-section-order" to omit unrelated form-template records:
                "viewConfiguration.type": "material-sample-form-template",
                // Filter by view name typed into the dropdown:
                ...filterBy(["name"])(input),
                // Filter by the form's group:
                ...(group && { group: { EQ: `${group}` } })
              })}
              optionLabel={view => view.name || view.id}
              model="collection-api/form-template"
              onChange={onChange}
              value={value}
            />
          )}
        </FieldSpy>{" "}
      </div>
    </label>
  );
}
