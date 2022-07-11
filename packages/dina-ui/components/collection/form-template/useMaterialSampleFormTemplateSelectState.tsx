import { PersistedResource } from "kitsu";
import { useEffect, useMemo, useState } from "react";
import {
  FormTemplate,
  MaterialSampleFormSectionId
} from "../../../types/collection-api";
import { materialSampleFormTemplateSchema } from "./materialSampleFormViewConfigSchema";
import { useMaterialSampleFormTemplateProps } from "./useMaterialSampleFormTemplateProps";

/**
 * Manages the state of a MaterialSampleForm Custom View selection
 * and returns the props needed to enable the custom view in a MaterialSampleForm.
 * Only handles Custom Views (e.g. show/hide fields), not default values.
 */
export function useMaterialSampleFormTemplateSelectState() {
  const [sampleFormTemplate, setSampleFormTemplate] =
    useState<PersistedResource<FormTemplate>>();

  const formTemplateConfig = useMemo(
    () =>
      sampleFormTemplate?.id
        ? materialSampleFormTemplateSchema.parse(
            sampleFormTemplate?.viewConfiguration
          )
        : undefined,
    [sampleFormTemplate]
  );

  // Call the custom view hook but don't use the "initialValues" fields
  // because we're not creating a sample from a template:
  const { enabledFields, visibleManagedAttributeKeys } =
    useMaterialSampleFormTemplateProps(formTemplateConfig) ?? {};

  // Store the nav order in the Page components state:
  const [navOrder, setNavOrder] = useState<
    MaterialSampleFormSectionId[] | null
  >(null);

  // Effect hook: When the Custom View changes,
  // update the navOrder to what's stored in the Custom View:
  useEffect(() => {
    if (sampleFormTemplate) {
      setNavOrder(formTemplateConfig?.navOrder ?? null);
    }
  }, [formTemplateConfig]);

  return {
    sampleFormTemplate,
    setSampleFormTemplate,
    navOrder,
    setNavOrder,
    enabledFields,
    visibleManagedAttributeKeys
  };
}
