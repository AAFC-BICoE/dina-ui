import { InputResource, KitsuResource } from "kitsu";
import { isNil, set, toPairs } from "lodash";
import { useMemo } from "react";
import { VisibleManagedAttributesConfig } from "../..";
import { CollectingEvent, MaterialSample } from "../../../types/collection-api";
import {
  MaterialSampleFormTemplateConfig,
  TemplateFieldMap
} from "./materialSampleFormViewConfigSchema";

/**
 * The props to pass into the MaterialSampleForm to enable a
 * custom view with restricted field sets and default values.
 */
export interface MaterialSampleFormTemplateProps {
  materialSampleInitialValues: InputResource<MaterialSample>;
  collectingEventInitialValues?: InputResource<CollectingEvent>;
  visibleManagedAttributeKeys?: VisibleManagedAttributesConfig;
}

/**
 * Gets the initial form values from the template default values.
 * Passing an undefined actionDefinition parameter makes the function return null;
 */
export function useMaterialSampleFormTemplateProps<
  T extends MaterialSampleFormTemplateConfig | undefined
>(
  actionDefinition?: T
): T extends MaterialSampleFormTemplateConfig
  ? MaterialSampleFormTemplateProps
  : null {
  return useMemo(() => {
    if (!actionDefinition) {
      return null as any;
    }

    const materialSampleInitialValues =
      getInitialValuesFromTemplateFields<MaterialSample>(
        "material-sample",
        actionDefinition.formTemplate.MATERIAL_SAMPLE?.templateFields
      );

    /* If no template entry for determination or there is only one determination, make it primary
     * same as georeference assertion */
    materialSampleInitialValues.organism =
      materialSampleInitialValues.organism?.map((org) => {
        if (org?.determination?.length === 1) {
          return {
            ...org,
            type: "organism",
            determination: [{ ...org.determination[0], isPrimary: true }]
          };
        }
        return org;
      });

    // Create a blank managed attribute map from the template's attribute order:
    const defaultManagedAttributes: Record<string, string> = {};
    for (const key of actionDefinition.managedAttributesOrder ?? []) {
      defaultManagedAttributes[key] = "";
    }

    materialSampleInitialValues.managedAttributes = {
      ...defaultManagedAttributes,
      ...materialSampleInitialValues.managedAttributes
    };

    const collectingEvent = getInitialValuesFromTemplateFields<CollectingEvent>(
      "collecting-event",
      actionDefinition.formTemplate.COLLECTING_EVENT?.templateFields
    );

    if (collectingEvent.id) {
      materialSampleInitialValues.collectingEvent = {
        type: "collecting-event",
        id: collectingEvent.id
      };
    } else {
      set(collectingEvent, "geoReferenceAssertions[0].isPrimary", true);
    }

    const collectingEventInitialValues = collectingEvent.id
      ? undefined
      : collectingEvent;

    const config: MaterialSampleFormTemplateProps = {
      materialSampleInitialValues,
      collectingEventInitialValues,
      visibleManagedAttributeKeys: {
        materialSample: actionDefinition.managedAttributesOrder,
        collectingEvent: actionDefinition.collectingEventManagedAttributesOrder,
        determination: actionDefinition.determinationManagedAttributesOrder
      }
    };

    return config;
  }, [actionDefinition]);
}

/** Gets the form's initial values from the stored Template. */
function getInitialValuesFromTemplateFields<TResource extends KitsuResource>(
  type: TResource["type"],
  templateFields?: TemplateFieldMap
): InputResource<TResource> {
  const initialValues = { type } as InputResource<TResource>;
  for (const [key, val] of toPairs(templateFields)) {
    if (val?.enabled && !isNil(val.defaultValue)) {
      set(initialValues, key, val.defaultValue);
    }
  }
  return initialValues;
}
