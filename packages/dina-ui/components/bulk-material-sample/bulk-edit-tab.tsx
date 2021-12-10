import { FormikProps } from "formik";
import { InputResource } from "kitsu";
import { isArray, omitBy, isEmpty } from "lodash";
import { createContext, useContext, useRef } from "react";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { MaterialSampleForm } from "../../pages/collection/material-sample/edit";
import { MaterialSample } from "../../types/collection-api/resources/MaterialSample";
import { useMaterialSampleSave } from "../collection";

export const BulkEditContext = createContext<{} | null>(null);

/** When the Component is inside the bulk editor's "Edit All" tab. */
export function useBulkEditTabContext() {
  return useContext(BulkEditContext);
}

export function useBulkEditTab() {
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

  const bulkEditTab = {
    key: "OVERWRITE_VALUES",
    title: formatMessage("editAll"),
    content: (
      <BulkEditContext.Provider value={{}}>
        <MaterialSampleForm
          buttonBar={null}
          materialSampleFormRef={bulkEditFormRef}
          materialSampleSaveHook={bulkEditSampleHook}
          materialSample={initialValues}
          disableAutoNamePrefix={true}
          disableSampleNameField={true}
          omitGroupField={true}
        />
      </BulkEditContext.Provider>
    )
  };

  /** Returns a sample with the overridden values. */
  async function withBulkEditOverrides(
    baseSample: InputResource<MaterialSample>
  ) {
    const formik = bulkEditFormRef.current;
    // Shouldn't happen, but check for type safety:
    if (!formik) {
      throw new Error("Missing Formik ref for Bulk Edit Tab");
    }

    /** Sample input including blank/empty fields. */
    const bulkEditSample = await bulkEditSampleHook.prepareSampleInput(
      formik.values,
      formik
    );

    /** Sample override object with only the non-empty fields. */
    const overrides = omitBy(bulkEditSample, isBlankResourceAttribute);

    // Combine the managed attributes dictionaries:
    const newManagedAttributes = {
      ...baseSample.managedAttributes,
      ...bulkEditSample?.managedAttributes
    };

    const newSample: InputResource<MaterialSample> = {
      ...baseSample,
      ...overrides,
      ...(!isEmpty(newManagedAttributes) && {
        managedAttributes: newManagedAttributes
      })
    };

    return newSample;
  }

  return { bulkEditTab, withBulkEditOverrides };
}

/**
 * Checks whether an API resource's attribute is blank.
 * This is used to check which of the Bulk Edit tab's values were deliberately edited.
 */
function isBlankResourceAttribute(value: any) {
  // "blank" means something different depending on the type:
  switch (typeof value) {
    case "string":
      // Empty string:
      return !value.trim();
    case "object":
    case "undefined":
      // empty object or empty array:
      return isArray(value) ? !value.join() : !value?.id;
    default:
      return false;
  }
}
