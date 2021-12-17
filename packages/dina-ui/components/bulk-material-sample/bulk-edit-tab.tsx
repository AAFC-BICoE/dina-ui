import {
  BulkEditTabContext,
  BulkEditTabContextI,
  SampleWithHooks,
  withoutBlankFields
} from "common-ui";
import { FormikProps } from "formik";
import { InputResource } from "kitsu";
import { isEmpty } from "lodash";
import { useRef } from "react";
import { BulkNavigatorTab } from "..";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { MaterialSampleForm } from "../../pages/collection/material-sample/edit";
import { MaterialSample } from "../../types/collection-api/resources/MaterialSample";
import { useMaterialSampleSave } from "../collection";

export interface UseBulkEditTabParams {
  sampleHooks: SampleWithHooks[];
  hideBulkEditTab?: boolean;
}

export function useBulkEditTab({
  hideBulkEditTab,
  sampleHooks
}: UseBulkEditTabParams) {
  const { formatMessage } = useDinaIntl();

  const initialValues: InputResource<MaterialSample> = {
    type: "material-sample",
    determination: []
  };
  const bulkEditSampleHook = useMaterialSampleSave({
    materialSample: initialValues
  });
  const bulkEditFormRef =
    useRef<FormikProps<InputResource<MaterialSample>>>(null);

  const ctx: BulkEditTabContextI = {
    sampleHooks,
    bulkEditFormRef
  };

  const bulkEditTab: BulkNavigatorTab = {
    formRef: bulkEditFormRef,
    key: "EDIT_ALL",
    title: formatMessage("editAll"),
    content: isSelected =>
      hideBulkEditTab ? null : (
        <BulkEditTabContext.Provider value={ctx}>
          <MaterialSampleForm
            buttonBar={null}
            materialSampleFormRef={bulkEditFormRef}
            materialSampleSaveHook={bulkEditSampleHook}
            materialSample={initialValues}
            disableAutoNamePrefix={true}
            disableSampleNameField={true}
            omitGroupField={true}
            isOffScreen={!isSelected}
            // Disable the nav's Are You Sure prompt when removing components,
            // because you aren't actually deleting data.
            disableNavRemovePrompt={true}
          />
        </BulkEditTabContext.Provider>
      )
  };

  function sampleBulkOverrider() {
    /** Sample input including blank/empty fields. */
    let bulkEditSample: InputResource<MaterialSample> | undefined;

    /** Returns a sample with the overridden values. */
    return async function withBulkEditOverrides(
      baseSample: InputResource<MaterialSample>
    ) {
      const formik = bulkEditFormRef.current;
      // Shouldn't happen, but check for type safety:
      if (!formik) {
        throw new Error("Missing Formik ref for Bulk Edit Tab");
      }

      // Initialize the bulk values once to make sure the same object is used each time.
      if (!bulkEditSample) {
        bulkEditSample = await bulkEditSampleHook.prepareSampleInput(
          formik.values
        );
      }

      /** Sample override object with only the non-empty fields. */
      const overrides = withoutBlankFields(bulkEditSample);

      // Combine the managed attributes dictionaries:
      const newManagedAttributes = {
        ...withoutBlankFields(baseSample.managedAttributes),
        ...withoutBlankFields(bulkEditSample?.managedAttributes)
      };

      const newOrganism = {
        ...withoutBlankFields(baseSample.organism),
        ...withoutBlankFields(bulkEditSample?.organism)
      };

      const newSample: InputResource<MaterialSample> = {
        ...baseSample,
        ...overrides,
        ...(!isEmpty(newManagedAttributes) && {
          managedAttributes: newManagedAttributes
        }),
        ...(!isEmpty(newOrganism) && {
          organism: newOrganism
        })
      };

      return newSample;
    };
  }

  return {
    bulkEditTab,
    sampleBulkOverrider,
    bulkEditFormRef
  };
}
