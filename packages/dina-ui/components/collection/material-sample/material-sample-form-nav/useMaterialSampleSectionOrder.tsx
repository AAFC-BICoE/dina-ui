import { uniq } from "lodash";
import { useDinaIntl } from "../../../../intl/dina-ui-intl";
import { MATERIAL_SAMPLE_FORM_LEGEND } from "../../../../types/collection-api";
import { ScrollTarget } from "./MaterialSampleFormNav";
import { AssociationsSwitch } from "./AssociationsSwitch";
import { OrganismsSwitch } from "./OrganismsSwitch";
import { useMaterialSampleSave } from "../useMaterialSample";

export interface MaterialSampleSectionOrderParams {
  dataComponentState: ReturnType<
    typeof useMaterialSampleSave
  >["dataComponentState"];
  navOrder?: string[] | null;
}

export function useMaterialSampleSectionOrder({
  dataComponentState,
  navOrder
}: MaterialSampleSectionOrderParams) {
  const { formatMessage, messages } = useDinaIntl();

  /** An array with all section IDs, beginning with the user-defined order. */
  const navOrderWithAllSections: string[] = uniq([
    ...(navOrder ?? []),
    ...MATERIAL_SAMPLE_FORM_LEGEND.map((component) => component.id)
  ]);

  /** Switch information to apply to the legend. */
  const scrollTargetSwitches: { [key: string]: Partial<ScrollTarget> } = {
    "collecting-event-component": {
      disabled: !dataComponentState.enableCollectingEvent,
      setEnabled: dataComponentState.setEnableCollectingEvent
    },
    "acquisition-event-component": {
      disabled: !dataComponentState.enableAcquisitionEvent,
      setEnabled: dataComponentState.setEnableAcquisitionEvent
    },
    "preparations-component": {
      disabled: !dataComponentState.enablePreparations,
      setEnabled: dataComponentState.setEnablePreparations
    },
    "organisms-component": {
      disabled: !dataComponentState.enableOrganisms,
      setEnabled: dataComponentState.setEnableOrganisms,
      customSwitch: OrganismsSwitch
    },
    "associations-component": {
      disabled: !dataComponentState.enableAssociations,
      setEnabled: dataComponentState.setEnableAssociations,
      customSwitch: AssociationsSwitch
    },
    "storage-component": {
      disabled: !dataComponentState.enableStorage,
      setEnabled: dataComponentState.setEnableStorage
    },
    "restriction-component": {
      disabled: !dataComponentState.enableRestrictions,
      setEnabled: dataComponentState.setEnableRestrictions
    },
    "scheduled-actions-component": {
      disabled: !dataComponentState.enableScheduledActions,
      setEnabled: dataComponentState.setEnableScheduledActions
    }
  };

  const scrollTargets: ScrollTarget[] = [
    ...MATERIAL_SAMPLE_FORM_LEGEND.map((component) => ({
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

  const sortedScrollTargets: ScrollTarget[] = uniq(
    navOrderWithAllSections.map(
      (id) => scrollTargets.filter((target) => target.id === id)[0]
    )
  );

  return { sortedScrollTargets };
}
