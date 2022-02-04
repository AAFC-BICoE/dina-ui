import {
  FieldSpy,
  filterBy,
  FormikButton,
  ResourceSelect,
  Tooltip
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useState } from "react";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { CustomView } from "../../../types/collection-api";
import { useManagedAttributesViewEditModal } from "./managed-attributes-view-modal";

export interface ManagedAttributesViewSelectProps {
  /**
   * The managed attribute component e.g. MATERIAL_SAMPLE.
   * Passed as a filter to the custom-view query.
   */
  managedAttributeComponent: string;
  onChange: (newValue: PersistedResource<CustomView>) => void;
  value?: PersistedResource<CustomView>;
}

/** Selector for Managed Attributes Views. Has a button to edit the View in a modal. */
export function ManagedAttributesViewSelect({
  managedAttributeComponent,
  value,
  onChange
}: ManagedAttributesViewSelectProps) {
  const { openManagedAttributesViewEditModal } =
    useManagedAttributesViewEditModal();

  const [lastUpdate, setLastUpdate] = useState(Date.now());

  return (
    <div className="d-flex gap-2 align-items-end">
      <label style={{ width: "20rem", marginTop: "15px" }}>
        <div className="mb-2">
          <strong>
            <DinaMessage id="customView" />
          </strong>
          <Tooltip id="field_visibleManagedAttributes_tooltip" />
        </div>
        <FieldSpy<string> fieldName="group">
          {group => (
            <ResourceSelect<CustomView>
              filter={input => ({
                // Filter by "managed-attributes-view" to omit unrelated custom-view records:
                "viewConfiguration.type": "managed-attributes-view",
                "viewConfiguration.managedAttributeComponent":
                  managedAttributeComponent,
                // Filter by view name typed into the dropdown:
                ...filterBy(["name"])(input),
                // Filter by the form's group:
                ...(group && { group: { EQ: `${group}` } })
              })}
              optionLabel={view => view.name || view.id}
              model="collection-api/custom-view"
              onChange={newVal => {
                onChange(newVal as PersistedResource<CustomView>);
                setLastUpdate(Date.now());
              }}
              value={value}
              // Refresh the query whenever the custom view is changed.
              key={lastUpdate}
            />
          )}
        </FieldSpy>
      </label>
      {value?.id && (
        <FormikButton
          className="btn btn-outline-secondary"
          // Open the custom view's editor modal, then
          onClick={() => openManagedAttributesViewEditModal(value.id, onChange)}
        >
          <DinaMessage id="editButtonText" />
        </FormikButton>
      )}
    </div>
  );
}
