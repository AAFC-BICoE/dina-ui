import {
  FieldSpy,
  filterBy,
  FormikButton,
  ResourceSelect,
  Tooltip
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useState } from "react";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";
import { FormTemplate } from "../../../../types/collection-api";
import { useManagedAttributesViewEditModal } from "./managed-attributes-view-modal";

export interface ManagedAttributesViewSelectProps {
  /**
   * The managed attribute component e.g. MATERIAL_SAMPLE.
   * Passed as a filter to the form-template query.
   */
  managedAttributeComponent?: string;
  onChange: (newValue: PersistedResource<FormTemplate>) => void;
  value?: PersistedResource<FormTemplate>;
}

/** Selector for Managed Attributes Views. Has a button to edit the View in a modal. */
export function ManagedAttributesViewSelect({
  managedAttributeComponent,
  value,
  onChange
}: ManagedAttributesViewSelectProps) {
  const { openManagedAttributesViewEditModal } =
    useManagedAttributesViewEditModal(managedAttributeComponent);
  const { formatMessage } = useDinaIntl();

  const [lastUpdate, setLastUpdate] = useState(Date.now());

  return (
    <div className="managed-attributes-view-select d-flex gap-2 align-items-end">
      <label style={{ width: "20rem", marginTop: "15px" }}>
        <div className="mb-2">
          <strong>
            <DinaMessage id="formTemplate" />
          </strong>
          <Tooltip id="field_visibleManagedAttributes_tooltip" />
        </div>
        <FieldSpy<string> fieldName="group">
          {group => (
            <ResourceSelect<FormTemplate>
              filter={input => ({
                // Filter by "managed-attributes-view" to omit unrelated form-template records:
                "viewConfiguration.type": "managed-attributes-view",
                ...(managedAttributeComponent && {
                  "viewConfiguration.managedAttributeComponent":
                    managedAttributeComponent
                }),
                // Filter by view name typed into the dropdown:
                ...filterBy(["name"])(input),
                // Filter by the form's group:
                ...(group && { group: { EQ: `${group}` } })
              })}
              optionLabel={view => view.name || view.id}
              model="collection-api/form-template"
              onChange={newVal => {
                onChange(newVal as PersistedResource<FormTemplate>);
                setLastUpdate(Date.now());
              }}
              value={value}
              // Refresh the query whenever the custom view is changed.
              key={lastUpdate}
              asyncOptions={[
                {
                  label: formatMessage("createFormTemplate"),
                  // Open the modal for creating a new custom view:
                  getResource: () =>
                    new Promise(resolve => {
                      openManagedAttributesViewEditModal(null, resolve);
                    })
                }
              ]}
            />
          )}
        </FieldSpy>
      </label>
      {value?.id && (
        <FormikButton
          className="btn btn-outline-secondary form-template-edit-button"
          // Open the custom view's editor modal, then
          onClick={() => openManagedAttributesViewEditModal(value.id, onChange)}
        >
          <DinaMessage id="editThisFormTemplate" />
        </FormikButton>
      )}
    </div>
  );
}
