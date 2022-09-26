import classNames from "classnames";
import {
  AreYouSureModal,
  FieldSpy,
  Tooltip,
  useBulkEditTabContext,
  useDinaFormContext,
  useModal
} from "common-ui";
import { uniq } from "lodash";
import dynamic from "next/dynamic";
import { ComponentType, PropsWithChildren } from "react";
import Switch, { ReactSwitchProps } from "react-switch";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";
import {
  MaterialSampleAssociation,
  MATERIAL_SAMPLE_FORM_LEGEND,
  Organism
} from "../../../../types/collection-api";
import { useMaterialSampleSave } from "../useMaterialSample";

export interface MaterialSampleFormNavProps {
  dataComponentState: ReturnType<
    typeof useMaterialSampleSave
  >["dataComponentState"];

  /** Disabled the Are You Sure modal when toggling a data component off. */
  disableRemovePrompt?: boolean;

  // Disables Collecting Event React Switch for child material samples
  disableCollectingEventSwitch?: boolean;

  navOrder?: string[] | null;
}

// Don't render the react-scrollspy-nav component during tests because it only works in the browser.
const renderNav = process.env.NODE_ENV !== "test";

const ScrollSpyNav = renderNav
  ? dynamic(
      async () => {
        const NavClass = await import("react-scrollspy-nav");

        // Do a small patch to the module:
        // Put the "active" class on the "list-group-item" div instead of the <a> tag:
        class MyNavClass extends NavClass.default {
          getNavLinkElement(sectionID) {
            return super
              .getNavLinkElement(sectionID)
              ?.closest(".list-group-item");
          }
        }

        return MyNavClass as any;
      },
      { ssr: false }
    )
  : "div";

interface ScrollTarget {
  id: string;
  msg: string | JSX.Element;
  className?: string;
  disabled?: boolean;
  setEnabled?: (val: boolean) => void;
  customSwitch?: ComponentType<ReactSwitchProps>;
}

/** Form navigation and toggles to enable/disable form sections. */
export function MaterialSampleFormNav({
  dataComponentState,
  disableRemovePrompt,
  disableCollectingEventSwitch,
  navOrder
}: MaterialSampleFormNavProps) {
  const { isTemplate } = useDinaFormContext();

  const { sortedScrollTargets } = useMaterialSampleSectionOrder({
    dataComponentState,
    navOrder
  });

  return (
    <div className="sticky-md-top material-sample-nav">
      <style>{`.material-sample-nav .active a { color: inherit !important; } .material-sample-nav { top: 70px; }`}</style>
      <ScrollSpyNav
        {...(renderNav
          ? {
              key: sortedScrollTargets.filter(it => !it.disabled).length,
              scrollTargetIds: sortedScrollTargets
                .filter(it => !it.disabled)
                .map(it => it.id),
              activeNavClass: "active",
              offset: -20,
              scrollDuration: "100"
            }
          : {})}
      >
        <nav className="card card-body">
          <label className="mb-2 text-uppercase">
            <strong>
              <DinaMessage id="dataComponents" />
            </strong>
          </label>
          {/* Display each row of the data components. */}
          <DataComponentNavGroup>
            {sortedScrollTargets.map(section => (
              <DataComponentNavItem
                key={section.id}
                section={section}
                disableRemovePrompt={disableRemovePrompt}
                disableSwitch={
                  section.id === "collecting-event-component" &&
                  disableCollectingEventSwitch
                }
              />
            ))}
          </DataComponentNavGroup>
        </nav>
      </ScrollSpyNav>
    </div>
  );
}

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
    ...MATERIAL_SAMPLE_FORM_LEGEND.map(component => component.id)
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
    ...MATERIAL_SAMPLE_FORM_LEGEND.map(component => ({
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
      id => scrollTargets.filter(target => target.id === id)[0]
    )
  );

  return { sortedScrollTargets };
}

/** The organisms switch adds an initial organism if there isn't one already. */
function OrganismsSwitch(props) {
  const bulkTabCtx = useBulkEditTabContext();

  return (
    <FieldSpy<Organism[]> fieldName="organism">
      {(organism, { form: { setFieldValue } }) => (
        <Switch
          {...props}
          onChange={newVal => {
            props.onChange?.(newVal);
            if (!bulkTabCtx && newVal && !organism?.length) {
              setFieldValue("organism", [{}]);
              setFieldValue("organismsQuantity", 1);
            }
          }}
        />
      )}
    </FieldSpy>
  );
}

/** The associations switch adds an initial association if there isn't one already. */
function AssociationsSwitch(props) {
  const bulkTabCtx = useBulkEditTabContext();

  return (
    <FieldSpy<MaterialSampleAssociation[]> fieldName="associations">
      {(associations, { form: { setFieldValue } }) => (
        <Switch
          {...props}
          onChange={newVal => {
            props.onChange?.(newVal);
            if (!bulkTabCtx && newVal && !associations?.length) {
              setFieldValue("associations", [{}]);
            }
          }}
        />
      )}
    </FieldSpy>
  );
}

export function DataComponentNavGroup({ children }: PropsWithChildren<{}>) {
  return <div className="list-group mb-3">{children}</div>;
}

interface NavItemProps {
  section: ScrollTarget;
  disableRemovePrompt?: boolean;
  disableSwitch?: boolean;
}

function DataComponentNavItem({
  section,
  disableRemovePrompt,
  disableSwitch
}: NavItemProps) {
  const { openModal } = useModal();

  const Tag = section.disabled ? "div" : "a";
  const SwitchComponent = section.customSwitch ?? Switch;

  function toggle(newVal: boolean) {
    if (!newVal && !disableRemovePrompt) {
      // When removing data, ask the user for confirmation first:
      openModal(
        <AreYouSureModal
          actionMessage={
            <DinaMessage
              id="removeComponentData"
              values={{ component: section.msg }}
            />
          }
          onYesButtonClicked={() => section.setEnabled?.(newVal)}
        />
      );
    } else {
      section.setEnabled?.(newVal);
    }
  }

  return (
    <div
      className={classNames(
        section.className,
        "list-group-item d-flex gap-2 align-items-center"
      )}
      key={section.id}
      style={{ height: "3rem", zIndex: 1030 }}
    >
      <Tag
        className="flex-grow-1 text-decoration-none"
        href={section.disabled ? undefined : `#${section.id}`}
      >
        {section.msg}
      </Tag>
      {section.setEnabled &&
        (disableSwitch ? (
          <Tooltip
            id={disableSwitch ? "disabledForChildMaterialSamples" : undefined}
            disableSpanMargin={true}
            visibleElement={
              <SwitchComponent
                className="mt-2"
                checked={!section.disabled}
                onChange={toggle}
                disabled={disableSwitch}
              />
            }
          />
        ) : (
          <SwitchComponent
            checked={!section.disabled}
            onChange={toggle}
            disabled={disableSwitch}
          />
        ))}
    </div>
  );
}
