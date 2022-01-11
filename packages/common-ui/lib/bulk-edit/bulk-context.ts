import { FormikProps } from "formik";
import { InputResource } from "kitsu";
import { createContext, MutableRefObject, RefObject, useContext } from "react";
import type { useMaterialSampleSave } from "../../../dina-ui/components/collection";
import type { MaterialSample } from "../../../dina-ui/types/collection-api/resources/MaterialSample";

export interface SampleWithHooks {
  key: string;
  sample: InputResource<MaterialSample>;
  saveHook: ReturnType<typeof useMaterialSampleSave>;
  formRef: MutableRefObject<FormikProps<InputResource<MaterialSample>> | null>;
}

export interface BulkEditTabContextI {
  bulkEditFormRef: RefObject<FormikProps<InputResource<MaterialSample>>>;
  sampleHooks: SampleWithHooks[];
}

export const BulkEditTabContext = createContext<BulkEditTabContextI | null>(
  null
);

/** When the Component is inside the bulk editor's "Edit All" tab. */
export function useBulkEditTabContext() {
  return useContext(BulkEditTabContext);
}
