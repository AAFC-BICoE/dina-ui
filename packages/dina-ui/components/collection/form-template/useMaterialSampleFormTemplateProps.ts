import { InputResource, KitsuResource } from "kitsu";
import { isNil, set, toPairs } from "lodash";
import { useMemo } from "react";
import {
  AcquisitionEvent,
  CollectingEvent,
  MaterialSample
} from "../../../types/collection-api";
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
  acquisitionEventInitialValues?: InputResource<AcquisitionEvent>;
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

    const collectingEvent = getInitialValuesFromTemplateFields<CollectingEvent>(
      "collecting-event",
      actionDefinition.formTemplate.COLLECTING_EVENT?.templateFields
    );
    const acquisitionEvent =
      getInitialValuesFromTemplateFields<AcquisitionEvent>(
        "acquisition-event",
        actionDefinition.formTemplate.ACQUISITION_EVENT?.templateFields
      );

    if (collectingEvent.id) {
      materialSampleInitialValues.collectingEvent = {
        type: "collecting-event",
        id: collectingEvent.id
      };
    } else {
      set(collectingEvent, "geoReferenceAssertions[0].isPrimary", true);
    }
    if (acquisitionEvent.id) {
      materialSampleInitialValues.acquisitionEvent = {
        type: "acquisition-event",
        id: acquisitionEvent.id
      };
    }

    const collectingEventInitialValues = collectingEvent.id
      ? undefined
      : collectingEvent;
    const acquisitionEventInitialValues = acquisitionEvent.id
      ? undefined
      : acquisitionEvent;

    // Delete unused variables from the initial values.
    delete (materialSampleInitialValues as any)?.templateCheckboxes;
    delete (materialSampleInitialValues as any)?.templateFields;
    delete (collectingEventInitialValues as any)?.templateCheckboxes;
    delete (collectingEventInitialValues as any)?.templateFields;
    delete (acquisitionEventInitialValues as any)?.templateCheckboxes;
    delete (acquisitionEventInitialValues as any)?.templateFields;

    const config: MaterialSampleFormTemplateProps = {
      materialSampleInitialValues,
      collectingEventInitialValues,
      acquisitionEventInitialValues
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
