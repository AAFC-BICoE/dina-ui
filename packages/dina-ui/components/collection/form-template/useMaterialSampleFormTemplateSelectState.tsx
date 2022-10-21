import { PersistedResource } from "kitsu";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  ACQUISITION_EVENT_COMPONENT_NAME,
  COLLECTING_EVENT_COMPONENT_NAME,
  FormTemplate
} from "../../../types/collection-api";
import {
  getAllComponentValues,
  getComponentValues
} from "../../form-template/formTemplateUtils";
import {
  MaterialSampleFormEnabledFields,
  VisibleManagedAttributesConfig
} from "../material-sample/MaterialSampleForm";
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

  // Get initial values of data components
  const materialSampleComponent = getAllComponentValues(sampleFormTemplate);
  if (!materialSampleComponent.associations?.length) {
    materialSampleComponent.associations = [{}];
  }

  // collecting event and acquisition components need to be isolated for useMaterialSample hook
  const collectingEventComponent = {
    ...getComponentValues(COLLECTING_EVENT_COMPONENT_NAME, sampleFormTemplate),
    managedAttributesOrder: []
  };

  const acquisitionEventComponent = getComponentValues(
    ACQUISITION_EVENT_COMPONENT_NAME,
    sampleFormTemplate
  );

  const materialSampleFormTemplate = {
    managedAttributesOrder: [],
    determinationManagedAttributesOrder: [],
    collectingEventManagedAttributesOrder: [],
    formTemplate: {
      COLLECTING_EVENT: getFormTemplateSchema(collectingEventComponent),
      MATERIAL_SAMPLE: getFormTemplateSchema(materialSampleComponent),
      ACQUISITION_EVENT: getFormTemplateSchema(acquisitionEventComponent)
    },
    type: "material-sample-form-template"
  };

  const formTemplateConfig = useMemo(
    () =>
      sampleFormTemplate?.id
        ? materialSampleFormTemplateSchema.parse(materialSampleFormTemplate)
        : undefined,
    [sampleFormTemplate]
  );

  // Call the custom view hook but don't use the "initialValues" fields
  // because we're not creating a sample from a template:
  const {
    enabledFields,
    visibleManagedAttributeKeys,
    materialSampleInitialValues,
    collectingEventInitialValues,
    acquisitionEventInitialValues
  }: {
    enabledFields: MaterialSampleFormEnabledFields;
    visibleManagedAttributeKeys?: VisibleManagedAttributesConfig | undefined;
    materialSampleInitialValues: any;
    collectingEventInitialValues?: any;
    acquisitionEventInitialValues?: any;
  } = useMaterialSampleFormTemplateProps(formTemplateConfig) ?? {};

  delete materialSampleInitialValues?.templateCheckboxes;
  delete collectingEventInitialValues?.templateCheckboxes;
  delete acquisitionEventInitialValues?.templateCheckboxes;

  // Store the nav order in the Page components state:
  const [navOrder, setNavOrder] = useState<string[] | null>(null);
  return {
    sampleFormTemplate,
    setSampleFormTemplate,
    navOrder,
    setNavOrder,
    enabledFields,
    visibleManagedAttributeKeys,
    materialSampleInitialValues,
    collectingEventInitialValues,
    acquisitionEventInitialValues
  };
}
function getFormTemplateSchema(component: any) {
  component.templateFields = {};
  const schema: any = {
    allowExisting: false,
    allowNew: false,
    templateFields: {}
  };

  Object.keys(component).forEach((key) => {
    schema.templateFields[key] = {
      defaultValue: component[key],
      enabled: true
    };
  });
  return schema;
}
