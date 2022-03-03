import { FieldSpy, filterBy, ResourceSelect } from "common-ui";
import { PersistedResource } from "kitsu";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { CustomView } from "../../../types/collection-api";

export interface MaterialSampleCustomViewSelectProps {
  value?: PersistedResource<CustomView>;
  onChange: (newValue: PersistedResource<CustomView>) => void;
}

export function MaterialSampleCustomViewSelect({
  onChange,
  value
}: MaterialSampleCustomViewSelectProps) {
  return (
    <label>
      <div className="mb-2 fw-bold">
        <DinaMessage id="customMaterialSampleFormView" />
      </div>
      <FieldSpy<string> fieldName="group">
        {group => (
          <ResourceSelect<CustomView>
            filter={input => ({
              // Filter by "material-sample-form-section-order" to omit unrelated custom-view records:
              "viewConfiguration.type": "material-sample-form-custom-view",
              // Filter by view name typed into the dropdown:
              ...filterBy(["name"])(input),
              // Filter by the form's group:
              ...(group && { group: { EQ: `${group}` } })
            })}
            optionLabel={view => view.name || view.id}
            model="collection-api/custom-view"
            onChange={onChange}
            value={value}
          />
        )}
      </FieldSpy>{" "}
    </label>
  );
}
