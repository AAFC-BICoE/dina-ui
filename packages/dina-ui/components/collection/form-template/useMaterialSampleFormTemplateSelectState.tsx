import { PersistedResource } from "kitsu";
import { useEffect, useMemo, useState } from "react";
import {
  COLLECTING_EVENT_COMPONENT_NAME,
  FormTemplate
} from "../../../types/collection-api";
import {
  getMaterialSampleComponentValues,
  getComponentValues,
  getComponentOrderFromTemplate
} from "../../form-template/formTemplateUtils";
import { VisibleManagedAttributesConfig } from "../material-sample/MaterialSampleForm";
import { materialSampleFormTemplateSchema } from "./materialSampleFormViewConfigSchema";
import { useMaterialSampleFormTemplateProps } from "./useMaterialSampleFormTemplateProps";
import { useLocalStorage } from "@rehooks/local-storage";
import { useApiClient } from "../../../../common-ui/lib";
import { useRouter } from "next/router";
import { useAccount } from "common-ui";

export const SAMPLE_FORM_TEMPLATE_KEY = "sampleFormTemplateKey";

export interface UseMaterialSampleFormTemplateSelectStateProps {
  /**
   * If this is provided, the local storage version won't be used. It will automatically load
   * this form template first.
   *
   * This value will not be saved into local storage so it doesn't override their usual choice.
   */
  temporaryFormTemplateUUID?: string;
}

/**
 * Manages the state of a MaterialSampleForm Form Template selection
 * and returns the props needed to enable the custom view in a MaterialSampleForm.
 * Only handles Form Templates (e.g. show/hide fields), not default values.
 */
export function useMaterialSampleFormTemplateSelectState({
  temporaryFormTemplateUUID
}: UseMaterialSampleFormTemplateSelectStateProps) {
  const { username } = useAccount();
  const { apiClient } = useApiClient();
  const router = useRouter();
  const formTemplateId = router?.query?.formTemplateId?.toString();
  // Store the nav order in the Page components state:
  const [navOrder, setNavOrder] = useState<string[] | null>(null);

  // UUID stored in local storage.
  const [sampleFormTemplateUUID, setSampleFormTemplateUUID] = useLocalStorage<
    string | undefined
  >(`${username}.${SAMPLE_FORM_TEMPLATE_KEY}`, undefined);

  // The retrieved form template, changes when the UUID has changed.
  const [sampleFormTemplate, setSampleFormTemplate] =
    useState<PersistedResource<FormTemplate>>();

  useEffect(() => {
    if (temporaryFormTemplateUUID || sampleFormTemplateUUID) {
      getFormTemplate();
    } else {
      setSampleFormTemplate(undefined);
      setNavOrder(null);
    }
  }, [sampleFormTemplateUUID, temporaryFormTemplateUUID]);

  useEffect(() => {
    if (formTemplateId) {
      setSampleFormTemplateUUID(formTemplateId);
    }
  }, []);

  async function getFormTemplate() {
    await apiClient
      .get<FormTemplate>(
        `collection-api/form-template/${
          temporaryFormTemplateUUID ?? sampleFormTemplateUUID
        }`,
        {}
      )
      .then((response) => {
        setSampleFormTemplate(response?.data);
        setNavOrder(getComponentOrderFromTemplate(response?.data));
      })
      .catch(() => {
        setSampleFormTemplate(undefined);
        setNavOrder(null);
      });
  }

  // Get initial values of data components
  const materialSampleComponent =
    getMaterialSampleComponentValues(sampleFormTemplate);
  if (!materialSampleComponent.associations?.length) {
    materialSampleComponent.associations = [];
  }

  // collecting event need to be isolated for useMaterialSample hook
  const collectingEventComponent = getComponentValues(
    COLLECTING_EVENT_COMPONENT_NAME,
    sampleFormTemplate,
    false
  );
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
      MATERIAL_SAMPLE: getFormTemplateSchema(materialSampleComponent)
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
    visibleManagedAttributeKeys,
    materialSampleInitialValues,
    collectingEventInitialValues
  }: {
    visibleManagedAttributeKeys?: VisibleManagedAttributesConfig | undefined;
    materialSampleInitialValues: any;
    collectingEventInitialValues?: any;
  } = useMaterialSampleFormTemplateProps(formTemplateConfig) ?? {};

  // Delete unused variables from the initial values.
  delete materialSampleInitialValues?.templateCheckboxes;
  delete materialSampleInitialValues?.templateFields;
  delete materialSampleInitialValues?.managedAttributesOrder;
  delete collectingEventInitialValues?.templateCheckboxes;
  delete collectingEventInitialValues?.templateFields;

  return {
    sampleFormTemplate,
    setSampleFormTemplateUUID,
    navOrder,
    setNavOrder,
    visibleManagedAttributeKeys,
    materialSampleInitialValues,
    collectingEventInitialValues
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
