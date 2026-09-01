import { FormikProps } from "formik";
import { InputResource, KitsuResource } from "kitsu";
import { createContext, MutableRefObject, RefObject, useContext } from "react";
import type { useMaterialSampleSave } from "@dina-ui/components";
import type { MaterialSample } from "@dina-ui/types/collection-api/resources/MaterialSample";

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

/**
 * The possible types a field can be cleared to.
 */
export enum ClearType {
  EmptyString = "emptyString",
  Null = "null"
}

export interface BulkEditTabContextI<T extends KitsuResource = KitsuResource> {
  bulkEditFormRef: RefObject<FormikProps<InputResource<T>> | null>;
  resourceHooks: ResourceWithHooks<T>[];

  // Indicate which fields are in "append" mode, otherwise it's considered a replace.
  appendFields?: Set<string>;
  setAppendFields?: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Indicate which fields the user wishes to empty the value.
  clearedFields?: Map<string, ClearType>;
  setClearedFields?: React.Dispatch<
    React.SetStateAction<Map<string, ClearType>>
  >;

  // Indiciate which fields should be deleted/removed.
  deletedFields?: Set<string>;
  setDeletedFields?: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const BulkEditTabContext = createContext<BulkEditTabContextI | null>(
  null
);

/** When the Component is inside the bulk editor's "Edit All" tab. */
export function useBulkEditTabContext() {
  return useContext(BulkEditTabContext);
}
