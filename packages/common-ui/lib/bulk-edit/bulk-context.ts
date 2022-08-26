import { FormikProps } from "formik";
import { InputResource, KitsuResource } from "kitsu";
import { createContext, MutableRefObject, RefObject, useContext } from "react";
import type { useMaterialSampleSave } from "../../../dina-ui/components";
import type { MaterialSample } from "../../../dina-ui/types/collection-api/resources/MaterialSample";

export interface SampleWithHooks {
  key: string;
  sample: InputResource<MaterialSample>;
  saveHook: ReturnType<typeof useMaterialSampleSave>;
  formRef: MutableRefObject<FormikProps<InputResource<MaterialSample>> | null>;
}

export interface ResourceWithHooks<T extends KitsuResource = KitsuResource> {
  key: string;
  resource: InputResource<T>;
  saveHook: ReturnType<any>;
  formRef: MutableRefObject<FormikProps<InputResource<T>> | null>;
}

export interface BulkEditTabContextI<T extends KitsuResource = KitsuResource> {
  bulkEditFormRef: RefObject<FormikProps<InputResource<T>>>;
  resourceHooks: ResourceWithHooks<T>[];
}

export const BulkEditTabContext = createContext<BulkEditTabContextI | null>(
  null
);

/** When the Component is inside the bulk editor's "Edit All" tab. */
export function useBulkEditTabContext() {
  return useContext(BulkEditTabContext);
}
