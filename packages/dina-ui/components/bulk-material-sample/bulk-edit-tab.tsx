import { FormikProps } from "formik";
import { InputResource } from "kitsu";
import { isArray, omitBy, isEmpty } from "lodash";
import { createContext, useContext, useRef, RefObject } from "react";
import { SampleWithHooks } from "..";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { MaterialSampleForm } from "../../pages/collection/material-sample/edit";
import { MaterialSample } from "../../types/collection-api/resources/MaterialSample";
import { useMaterialSampleSave } from "../collection";

export interface BulkEditTabContextI {
  bulkEditFormRef: RefObject<FormikProps<InputResource<MaterialSample>>>;
  sampleHooks: SampleWithHooks[];
}

export const BulkEditTabContext = createContext<BulkEditTabContextI | null>(
  null
);

export interface UseBulkEditTabParams {
  sampleHooks: SampleWithHooks[];
}

/** When the Component is inside the bulk editor's "Edit All" tab. */
export function useBulkEditTabContext() {
  return useContext(BulkEditTabContext);
}

export function useBulkEditTab({ sampleHooks }: UseBulkEditTabParams) {
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

  const bulkEditTab = {
    key: "EDIT_ALL",
    title: formatMessage("editAll"),
    content: () => (
      <BulkEditTabContext.Provider value={ctx}>
        <MaterialSampleForm
          buttonBar={null}
          materialSampleFormRef={bulkEditFormRef}
          materialSampleSaveHook={bulkEditSampleHook}
          materialSample={initialValues}
          disableAutoNamePrefix={true}
          disableSampleNameField={true}
          omitGroupField={true}
        />
      </BulkEditTabContext.Provider>
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
    const overrides = withoutBlankFields(bulkEditSample);

    // Combine the managed attributes dictionaries:
    const newManagedAttributes = {
      ...withoutBlankFields(baseSample.managedAttributes),
      ...withoutBlankFields(bulkEditSample?.managedAttributes)
    } as { [x: string]: string };

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
  }

  return { bulkEditTab, withBulkEditOverrides };
}

/**
 * Checks whether an API resource's attribute is blank.
 * This is used to check which of the Bulk Edit tab's values were deliberately edited.
 */
export function isBlankResourceAttribute(value: any) {
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

function withoutBlankFields<T>(original: T): Partial<T> {
  return omitBy(original, isBlankResourceAttribute) as Partial<T>;
}
