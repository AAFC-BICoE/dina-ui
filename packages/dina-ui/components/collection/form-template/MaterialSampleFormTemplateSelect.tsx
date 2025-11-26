import {
  ResourceSelect,
  SimpleSearchFilterBuilder,
  useAccount
} from "common-ui";
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

  return (
    <label className="d-flex align-items-center gap-2 form-template-select">
      <div className="fw-bold">
        <DinaMessage id="formTemplateSelection" />
      </div>
      <div style={{ width: "20rem" }}>
        <ResourceSelect<FormTemplate>
          filter={(input) =>
            SimpleSearchFilterBuilder.create<FormTemplate>()
              .searchFilter("name", input)
              .where(
                "viewConfiguration.type" as any,
                "EQ",
                "material-sample-form-template"
              )
              .when(!isAdmin, (builder) => builder.whereIn("group", groupNames))
              .build()
          }
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
