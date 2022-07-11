import { FormikProps } from "formik";
import { InputResource } from "kitsu";
import { Metadata } from "../../../dina-ui/types/objectstore-api"; // packages/dina-ui/types/objectstore-api
import { createContext, MutableRefObject, RefObject, useContext } from "react";
import type { useMaterialSampleSave } from "../../../dina-ui/components";
import type { MaterialSample } from "../../../dina-ui/types/collection-api/resources/MaterialSample";

export interface MetadataWithHooks {
  key: string;
  sample: InputResource<Metadata>;
  saveHook: ReturnType<typeof useMaterialSampleSave>;
  formRef: MutableRefObject<FormikProps<InputResource<Metadata>> | null>;
}

export interface BulkEditTabContextI {
  bulkEditFormRef: RefObject<FormikProps<InputResource<Metadata>>>;
  metadataHooks: MetadataWithHooks[];
}

export const BulkEditTabContext = createContext<BulkEditTabContextI | null>(
  null
);

/** When the Component is inside the bulk editor's "Edit All" tab. */
export function useBulkEditTabContext() {
  return useContext(BulkEditTabContext);
}
