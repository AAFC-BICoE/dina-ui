import { PersistedResource } from "kitsu";
import { useEffect, useState } from "react";
import { FormTemplate } from "../../../types/collection-api";
import { getComponentOrderFromTemplate } from "../../form-template/formTemplateUtils";
import { useLocalStorage } from "@rehooks/local-storage";
import { useApiClient } from "../../../../common-ui/lib";
import { useRouter } from "next/router";

export const SAMPLE_FORM_TEMPLATE_KEY = "sampleFormTemplateKey";
/**
 * Manages the state of a MaterialSampleForm Form Template selection
 * and returns the props needed to enable the custom view in a MaterialSampleForm.
 * Only handles Form Templates (e.g. show/hide fields), not default values.
 */
export function useMaterialSampleFormTemplateSelectState() {
  const { apiClient } = useApiClient();
  const router = useRouter();
  const formTemplateId = router?.query?.formTemplateId?.toString();
  // Store the nav order in the Page components state:
  const [navOrder, setNavOrder] = useState<string[] | null>(null);

  // UUID stored in local storage.
  const [sampleFormTemplateUUID, setSampleFormTemplateUUID] = useLocalStorage<
    string | undefined
  >(SAMPLE_FORM_TEMPLATE_KEY, undefined);

  // The retrieved form template, changes when the UUID has changed.
  const [sampleFormTemplate, setSampleFormTemplate] =
    useState<PersistedResource<FormTemplate>>();

  useEffect(() => {
    if (sampleFormTemplateUUID) {
      getFormTemplate();
    } else {
      setSampleFormTemplate(undefined);
      setNavOrder(null);
    }
  }, [sampleFormTemplateUUID]);

  useEffect(() => {
    if (formTemplateId) {
      setSampleFormTemplateUUID(formTemplateId);
    }
  }, []);

  async function getFormTemplate() {
    await apiClient
      .get<FormTemplate>(
        `collection-api/form-template/${sampleFormTemplateUUID}`,
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

  return {
    sampleFormTemplate,
    setSampleFormTemplateUUID,
    navOrder,
    setNavOrder
  };
}
