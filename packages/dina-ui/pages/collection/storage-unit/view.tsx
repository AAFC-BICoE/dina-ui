import { DeleteButton, DinaForm, EditButton } from "common-ui";
import { PersistedResource } from "kitsu";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  ResourceFormProps,
  StorageActionMode,
  storageUnitDisplayName,
  StorageUnitActionsDropdown,
  StorageUnitFormFields,
  ViewPageLayout
} from "../../../components";
import { StorageUnit } from "../../../types/collection-api";

export default function StorageUnitDetailsPage() {
  const router = useRouter();
  const [actionMode, setActionMode] = useState<StorageActionMode>("VIEW");

  // Reset action mode when navigating to a different storage unit

  useEffect(() => {
    setActionMode("VIEW");
  }, [router.query.id]);

  return (
    <ViewPageLayout<StorageUnit>
      form={(props) => (
        <DinaForm<StorageUnit> {...props}>
          <StorageUnitFormFields
            actionMode={actionMode}
            onCancelAction={() => setActionMode("VIEW")}
          />
        </DinaForm>
      )}
      query={(id) => ({
        path: `collection-api/storage-unit/${id}`,
        include: "parentStorageUnit,storageUnitType",
        optfields: { "storage-unit": "storageUnitChildren, hierarchy" }
      })}
      entityLink="/collection/storage-unit"
      type="storage-unit"
      apiBaseUrl="/collection-api"
      editButton={(formProps) => (
        <StorageEditAndActions
          {...formProps}
          actionMode={actionMode}
          onAction={setActionMode}
        />
      )}
      deleteButton={(formProps) =>
        hasChildren(formProps.initialValues) ? null : (
          <DeleteButton
            id={formProps.initialValues.id}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collection/storage-unit/list"
            type="storage-unit"
          />
        )
      }
      showGenerateLabelButton={true}
      nameField={(unit) => storageUnitDisplayName(unit)}
      showRevisionsLink={true}
    />
  );
}

function hasChildren(unit: PersistedResource<StorageUnit>) {
  const children = unit.storageUnitChildren;
  return !!children?.length;
}

function StorageEditAndActions({
  initialValues,
  actionMode,
  onAction
}: ResourceFormProps<StorageUnit> & {
  actionMode: StorageActionMode;
  onAction: (mode: StorageActionMode) => void;
}) {
  const hasContents = !!(initialValues.storageUnitChildren as any[])?.length;

  return (
    <div className="d-flex gap-1">
      <EditButton
        entityId={initialValues.id}
        entityLink="collection/storage-unit"
      />
      <StorageUnitActionsDropdown
        storageUnit={initialValues}
        hasContents={hasContents}
        activeMode={actionMode}
        onAction={onAction}
      />
    </div>
  );
}
