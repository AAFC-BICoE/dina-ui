import { PersistedResource } from "kitsu";
import { useEffect, useMemo, useState } from "react";
import { FormTemplate } from "../../../types/collection-api";
import { materialSampleFormTemplateSchema } from "./materialSampleFormViewConfigSchema";
import { useMaterialSampleFormTemplateProps } from "./useMaterialSampleFormTemplateProps";

/**
 * Manages the state of a MaterialSampleForm Form Template selection
 * and returns the props needed to enable the custom view in a MaterialSampleForm.
 * Only handles Form Templates (e.g. show/hide fields), not default values.
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
  const [navOrder, setNavOrder] = useState<string[] | null>(null);

  return {
    sampleFormTemplate,
    setSampleFormTemplate,
    navOrder,
    setNavOrder,
    enabledFields,
    visibleManagedAttributeKeys
  };
}
