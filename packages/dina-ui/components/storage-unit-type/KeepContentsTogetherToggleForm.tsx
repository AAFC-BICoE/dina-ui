import { DinaForm, DinaFormOnSubmit, LoadingSpinner } from "common-ui";
import { PersistedResource } from "kitsu";
import { useState } from "react";
import Switch from "react-switch";
import { StorageUnitType } from "../../types/collection-api";

export interface KeepContentsTogetherToggleForm {
  initialValues: PersistedResource<StorageUnitType>;
}

/** Toggle that immediately saves the state of the isInseperable field. */
export function KeepContentsTogetherToggleForm({
  initialValues
}: KeepContentsTogetherToggleForm) {
  const [formState, setFormState] = useState(initialValues);

  const onSubmit: DinaFormOnSubmit<PersistedResource<StorageUnitType>> =
    async ({ submittedValues: { id, type, isInseperable }, api: { save } }) => {
      // Only toggle the isInseperable field:
      const storageTypeToSave = { id, type, isInseperable: !isInseperable };
      const [savedStorageType] = await save<StorageUnitType>(
        [{ resource: storageTypeToSave, type }],
        { apiBaseUrl: "/collection-api" }
      );
      setFormState(savedStorageType);
    };

  return (
    <DinaForm
      initialValues={formState}
      enableReinitialize={true}
      onSubmit={onSubmit}
    >
      {(form) =>
        form.isSubmitting ? (
          <LoadingSpinner loading={true} />
        ) : (
          <Switch
            checked={!!form.values.isInseperable}
            onChange={form.submitForm}
          />
        )
      }
    </DinaForm>
  );
}
