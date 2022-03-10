import { PersistedResource } from "kitsu";
import { useEffect, useMemo, useState } from "react";
import {
  CustomView,
  MaterialSampleFormSectionId
} from "../../../types/collection-api";
import { materialSampleFormCustomViewSchema } from "./materialSampleFormViewConfigSchema";
import { useMaterialSampleFormCustomViewProps } from "./useMaterialSampleFormCustomViewProps";

/**
 * Manages the state of a MaterialSampleForm Custom View selection
 * and returns the props needed to enable the custom view in a MaterialSampleForm.
 * Only handles Custom Views (e.g. show/hide fields), not default values.
 */
export function useMaterialSampleFormCustomViewSelectState() {
  const [sampleFormCustomView, setSampleFormCustomView] =
    useState<PersistedResource<CustomView>>();

  const customViewConfig = useMemo(
    () =>
      sampleFormCustomView?.id
        ? materialSampleFormCustomViewSchema.parse(
            sampleFormCustomView?.viewConfiguration
          )
        : undefined,
    [sampleFormCustomView]
  );

  // Call the custom view hook but don't use the "initialValues" fields
  // because we're not creating a sample from a template:
  const { enabledFields, visibleManagedAttributeKeys } =
    useMaterialSampleFormCustomViewProps(customViewConfig) ?? {};

  // Store the nav order in the Page components state:
  const [navOrder, setNavOrder] = useState<
    MaterialSampleFormSectionId[] | null
  >(null);

  // Effect hook: When the Custom View changes,
  // update the navOrder to what's stored in the Custom View:
  useEffect(() => {
    if (sampleFormCustomView) {
      setNavOrder(customViewConfig?.navOrder ?? null);
    }
  }, [customViewConfig]);

  return {
    sampleFormCustomView,
    setSampleFormCustomView,
    navOrder,
    setNavOrder,
    enabledFields,
    visibleManagedAttributeKeys
  };
}
