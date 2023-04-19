import { uniq, compact } from "lodash";
import { useDinaIntl } from "../../../../intl/dina-ui-intl";
import {
  ASSOCIATIONS_COMPONENT_NAME,
  COLLECTING_EVENT_COMPONENT_NAME,
  MATERIAL_SAMPLE_FORM_LEGEND,
  ORGANISMS_COMPONENT_NAME,
  PREPARATIONS_COMPONENT_NAME,
  RESTRICTION_COMPONENT_NAME,
  SCHEDULED_ACTIONS_COMPONENT_NAME,
  SPLIT_CONFIGURATION_COMPONENT_NAME,
  STORAGE_COMPONENT_NAME
} from "../../../../types/collection-api";
import { ScrollTarget } from "./MaterialSampleFormNav";
import { AssociationsSwitch } from "./AssociationsSwitch";
import { OrganismsSwitch } from "./OrganismsSwitch";
import { useMaterialSampleSave } from "../useMaterialSample";

export interface MaterialSampleSectionOrderParams {
  dataComponentState: ReturnType<
    typeof useMaterialSampleSave
  >["dataComponentState"];
  navOrder?: string[] | null;
  isTemplate: boolean;
}

export function useMaterialSampleSectionOrder({
  dataComponentState,
  navOrder,
  isTemplate
}: MaterialSampleSectionOrderParams) {
  const { formatMessage, messages } = useDinaIntl();

  /** An array with all section IDs, beginning with the user-defined order. */
  const navOrderWithAllSections: string[] = uniq([
    ...(navOrder ?? []),
    ...MATERIAL_SAMPLE_FORM_LEGEND.filter((component) =>
      isTemplate ? true : !component.formTemplateOnly
    ).map((component) => component.id)
  ]);

  /** Switch information to apply to the legend. */
  const scrollTargetSwitches: { [key: string]: Partial<ScrollTarget> } = {
    [SPLIT_CONFIGURATION_COMPONENT_NAME]: {
      disabled: !dataComponentState.enableSplitConfiguration,
      setEnabled: dataComponentState.setEnableSplitConfiguration
    },
    [COLLECTING_EVENT_COMPONENT_NAME]: {
      disabled: !dataComponentState.enableCollectingEvent,
      setEnabled: dataComponentState.setEnableCollectingEvent
    },
    [PREPARATIONS_COMPONENT_NAME]: {
      disabled: !dataComponentState.enablePreparations,
      setEnabled: dataComponentState.setEnablePreparations
    },
    [ORGANISMS_COMPONENT_NAME]: {
      disabled: !dataComponentState.enableOrganisms,
      setEnabled: dataComponentState.setEnableOrganisms,
      customSwitch: OrganismsSwitch
    },
    [ASSOCIATIONS_COMPONENT_NAME]: {
      disabled: !dataComponentState.enableAssociations,
      setEnabled: dataComponentState.setEnableAssociations,
      customSwitch: AssociationsSwitch
    },
    [STORAGE_COMPONENT_NAME]: {
      disabled: !dataComponentState.enableStorage,
      setEnabled: dataComponentState.setEnableStorage
    },
    [RESTRICTION_COMPONENT_NAME]: {
      disabled: !dataComponentState.enableRestrictions,
      setEnabled: dataComponentState.setEnableRestrictions
    },
    [SCHEDULED_ACTIONS_COMPONENT_NAME]: {
      disabled: !dataComponentState.enableScheduledActions,
      setEnabled: dataComponentState.setEnableScheduledActions
    }
  };

  const scrollTargets: ScrollTarget[] = [
    ...MATERIAL_SAMPLE_FORM_LEGEND.filter((component) =>
      isTemplate ? true : !component.formTemplateOnly
    ).map((component) => ({
      id: component.id,
      msg: messages[component.labelKey]
        ? formatMessage(component.labelKey as any)
        : component.labelKey,
      className: component.switchClassName,
      disabled: scrollTargetSwitches[component.id]?.disabled,
      setEnabled: scrollTargetSwitches[component.id]?.setEnabled,
      customSwitch: scrollTargetSwitches[component.id]?.customSwitch
    }))
  ];

  const sortedScrollTargets: ScrollTarget[] = compact(
    uniq(
      navOrderWithAllSections.map(
        (id) => scrollTargets.filter((target) => target.id === id)[0]
      )
    )
  );

  return { sortedScrollTargets };
}
