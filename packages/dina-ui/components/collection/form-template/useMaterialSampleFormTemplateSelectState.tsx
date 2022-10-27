import { PersistedResource } from "kitsu";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  ACQUISITION_EVENT_COMPONENT_NAME,
  COLLECTING_EVENT_COMPONENT_NAME,
  FormTemplate
} from "../../../types/collection-api";
import {
  getMaterialSampleComponentValues,
  getComponentValues
} from "../../form-template/formTemplateUtils";
import {
  MaterialSampleFormEnabledFields,
  VisibleManagedAttributesConfig
} from "../material-sample/MaterialSampleForm";
import { materialSampleFormTemplateSchema } from "./materialSampleFormViewConfigSchema";
import { useMaterialSampleFormTemplateProps } from "./useMaterialSampleFormTemplateProps";
import { useLocalStorage } from "@rehooks/local-storage";
import { useApiClient } from "../../../../common-ui/lib";

const SAMPLE_FORM_TEMPLATE_KEY = "sampleFormTemplateKey";
/**
 * Manages the state of a MaterialSampleForm Form Template selection
 * and returns the props needed to enable the custom view in a MaterialSampleForm.
 * Only handles Form Templates (e.g. show/hide fields), not default values.
 */
export function useMaterialSampleFormTemplateSelectState() {
  const { apiClient } = useApiClient();

  // const [formTemplateUUID, setFormTemplateUUID] = useLocalStorage<
  //   string | undefined
  // >(SAMPLE_FORM_TEMPLATE_KEY, undefined);

  const [sampleFormTemplate, setSampleFormTemplate] = useLocalStorage<
    PersistedResource<FormTemplate> | undefined
  >(SAMPLE_FORM_TEMPLATE_KEY, undefined);

  useEffect(() => {
    if (sampleFormTemplate?.id) {
      getFormTemplate();
    }
  }, [sampleFormTemplate]);

  async function getFormTemplate() {
    await apiClient
      .get<FormTemplate>(
        `collection-api/form-template/${sampleFormTemplate?.id}`,
        {}
      )
      .then((response) => {
        setSampleFormTemplate(response?.data);
      });
  }

  // Get initial values of data components
  const materialSampleComponent =
    getMaterialSampleComponentValues(sampleFormTemplate);
  if (!materialSampleComponent.associations?.length) {
    materialSampleComponent.associations = [];
  }

  // collecting event and acquisition components need to be isolated for useMaterialSample hook
  const collectingEventComponent = getComponentValues(
    COLLECTING_EVENT_COMPONENT_NAME,
    sampleFormTemplate
  );
  const acquisitionEventComponent = getComponentValues(
    ACQUISITION_EVENT_COMPONENT_NAME,
    sampleFormTemplate
  );
  const hasAcquisitionEvent =
    Object.keys(acquisitionEventComponent.templateCheckboxes).length > 0
      ? true
      : false;
  const hasCollectingEvent =
    Object.keys(collectingEventComponent.templateCheckboxes).length > 0
      ? true
      : false;

  // Re-using viewConfiguration object structure for now
  const materialSampleFormTemplate = {
    managedAttributesOrder:
      materialSampleComponent.managedAttributesOrder ?? [],
    determinationManagedAttributesOrder:
      materialSampleComponent.determinationManagedAttributesOrder ?? [],
    collectingEventManagedAttributesOrder:
      materialSampleComponent.collectingEventManagedAttributesOrder ?? [],
    formTemplate: {
      COLLECTING_EVENT: hasCollectingEvent
        ? getFormTemplateSchema(collectingEventComponent)
        : undefined,
      MATERIAL_SAMPLE: getFormTemplateSchema(materialSampleComponent),
      ACQUISITION_EVENT: hasAcquisitionEvent
        ? getFormTemplateSchema(acquisitionEventComponent)
        : undefined
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
  delete materialSampleInitialValues?.templateFields;
  delete materialSampleInitialValues?.managedAttributesOrder;
  delete collectingEventInitialValues?.templateCheckboxes;
  delete collectingEventInitialValues?.templateFields;
  delete acquisitionEventInitialValues?.templateCheckboxes;
  delete acquisitionEventInitialValues?.templateFields;

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
