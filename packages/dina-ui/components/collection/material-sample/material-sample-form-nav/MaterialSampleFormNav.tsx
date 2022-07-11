import classNames from "classnames";
import {
  AreYouSureModal,
  FieldSpy,
  Tooltip,
  useBulkEditTabContext,
  useDinaFormContext,
  useModal
} from "common-ui";
import { PersistedResource } from "kitsu";
import { uniq } from "lodash";
import dynamic from "next/dynamic";
import { ComponentType, PropsWithChildren, useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import {
  SortableContainer,
  SortableElement,
  SortableHandle,
  SortEnd
} from "react-sortable-hoc";
import Switch, { ReactSwitchProps } from "react-switch";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";
import {
  FormTemplate,
  MaterialSampleAssociation,
  MaterialSampleFormSectionId,
  MATERIAL_SAMPLE_FORM_SECTIONS,
  Organism
} from "../../../../types/collection-api";
import { MaterialSampleNavFormTemplateSelect } from "./MaterialSampleNavFormTemplateSelect";
import { useMaterialSampleSave } from "../useMaterialSample";
import { materialSampleNavOrderSchema } from "./materialSampleNavOrderSchema";

export interface MaterialSampleFormNavProps {
  dataComponentState: ReturnType<
    typeof useMaterialSampleSave
  >["dataComponentState"];

  /** Disabled the Are You Sure modal when toggling a data component off. */
  disableRemovePrompt?: boolean;

  // Disables Collecting Event React Switch for child material samples
  disableCollectingEventSwitch?: boolean;

  /** Hides the custom view selection, but keeps the drag/drop handles. */
  hideFormTemplateSelect?: boolean;

  navOrder?: MaterialSampleFormSectionId[] | null;
  onChangeNavOrder: (newOrder: MaterialSampleFormSectionId[] | null) => void;
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

interface ScrollTarget<T extends MaterialSampleFormSectionId> {
  id: T;
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
  hideFormTemplateSelect,
  navOrder,
  onChangeNavOrder
}: MaterialSampleFormNavProps) {
  const { isTemplate } = useDinaFormContext();

  const { sortedScrollTargets } = useMaterialSampleSectionOrder({
    dataComponentState,
    navOrder
  });

  const [formTemplate, setFormTemplateWithNoSideEffects] = useState<
    PersistedResource<FormTemplate> | { id: null }
  >();

  function updateFormTemplate(
    newView: PersistedResource<FormTemplate> | { id: null }
  ) {
    // Update component state:
    setFormTemplateWithNoSideEffects(newView);

    // Update the nav order:
    if (newView.id) {
      if (materialSampleNavOrderSchema.isValidSync(newView.viewConfiguration)) {
        onChangeNavOrder(newView.viewConfiguration.navOrder ?? []);
      }
    } else {
      onChangeNavOrder(null);
    }
  }

  function onSortStart(_, event: unknown) {
    if (event instanceof MouseEvent) {
      document.body.style.cursor = "grabbing";
    }
  }

  function onSortEnd(sortEnd: SortEnd) {
    document.body.style.cursor = "inherit";

    const newOrder = arrayMove(
      sortedScrollTargets,
      sortEnd.oldIndex,
      sortEnd.newIndex
    ).map(it => it.id);
    onChangeNavOrder?.(newOrder);
  }

  return (
    <div className="sticky-md-top material-sample-nav">
      <style>{`.material-sample-nav .active a { color: inherit !important; }`}</style>
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
          <SortableNavGroup
            axis="y"
            useDragHandle={true}
            onSortStart={onSortStart}
            onSortEnd={onSortEnd}
          >
            {sortedScrollTargets.map((section, index) => (
              <SortableNavItem
                key={section.id}
                index={index}
                section={section}
                disableRemovePrompt={disableRemovePrompt}
                disableSwitch={
                  section.id === "collecting-event-section" &&
                  disableCollectingEventSwitch
                }
              />
            ))}
          </SortableNavGroup>
          {!hideFormTemplateSelect && (
            <MaterialSampleNavFormTemplateSelect
              onChange={updateFormTemplate}
              selectedView={formTemplate}
              navOrder={navOrder ?? null}
            />
          )}
          {isTemplate && (
            <div className="alert alert-warning">
              <DinaMessage id="materialSampleNavTemplateInfo" />
            </div>
          )}
        </nav>
      </ScrollSpyNav>
    </div>
  );
}

export interface MaterialSampleSectionOrderParams {
  dataComponentState: ReturnType<
    typeof useMaterialSampleSave
  >["dataComponentState"];
  navOrder?: MaterialSampleFormSectionId[] | null;
}

export function useMaterialSampleSectionOrder({
  dataComponentState,
  navOrder
}: MaterialSampleSectionOrderParams) {
  const { formatMessage } = useDinaIntl();

  /** An array with all section IDs, beginning with the user-defined order. */
  const navOrderWithAllSections = uniq([
    ...(navOrder ?? []),
    ...MATERIAL_SAMPLE_FORM_SECTIONS
  ]);

  const scrollTargets: { [P in MaterialSampleFormSectionId]: ScrollTarget<P> } =
    {
      "identifiers-section": {
        id: "identifiers-section",
        msg: <DinaMessage id="identifiers" />
      },
      "material-sample-info-section": {
        id: "material-sample-info-section",
        msg: <DinaMessage id="materialSampleInfo" />
      },
      "collecting-event-section": {
        id: "collecting-event-section",
        msg: formatMessage("collectingEvent"),
        className: "enable-collecting-event",
        disabled: !dataComponentState.enableCollectingEvent,
        setEnabled: dataComponentState.setEnableCollectingEvent
      },
      "acquisition-event-section": {
        id: "acquisition-event-section",
        msg: formatMessage("acquisitionEvent"),
        className: "enable-acquisition-event",
        disabled: !dataComponentState.enableAcquisitionEvent,
        setEnabled: dataComponentState.setEnableAcquisitionEvent
      },
      "preparations-section": {
        id: "preparations-section",
        msg: formatMessage("preparations"),
        className: "enable-catalogue-info",
        disabled: !dataComponentState.enablePreparations,
        setEnabled: dataComponentState.setEnablePreparations
      },
      "organisms-section": {
        id: "organisms-section",
        msg: formatMessage("organisms"),
        className: "enable-organisms",
        disabled: !dataComponentState.enableOrganisms,
        setEnabled: dataComponentState.setEnableOrganisms,
        customSwitch: OrganismsSwitch
      },
      "associations-section": {
        id: "associations-section",
        msg: formatMessage("associationsLegend"),
        className: "enable-associations",
        disabled: !dataComponentState.enableAssociations,
        setEnabled: dataComponentState.setEnableAssociations,
        customSwitch: AssociationsSwitch
      },
      "storage-section": {
        id: "storage-section",
        msg: formatMessage("storage"),
        className: "enable-storage",
        disabled: !dataComponentState.enableStorage,
        setEnabled: dataComponentState.setEnableStorage
      },
      "restriction-section": {
        id: "restriction-section",
        msg: formatMessage("restrictions"),
        className: "enable-restrictions",
        disabled: !dataComponentState.enableRestrictions,
        setEnabled: dataComponentState.setEnableRestrictions
      },
      "scheduled-actions-section": {
        id: "scheduled-actions-section",
        msg: formatMessage("scheduledActions"),
        className: "enable-scheduled-actions",
        disabled: !dataComponentState.enableScheduledActions,
        setEnabled: dataComponentState.setEnableScheduledActions
      },
      "managedAttributes-section": {
        id: "managedAttributes-section",
        msg: formatMessage("managedAttributes")
      },
      "material-sample-attachments-section": {
        id: "material-sample-attachments-section",
        msg: formatMessage("materialSampleAttachments")
      }
    };

  const sortedScrollTargets = uniq([
    ...navOrderWithAllSections.map(id => scrollTargets[id]),
    ...MATERIAL_SAMPLE_FORM_SECTIONS.map(id => scrollTargets[id])
  ]);

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

export const SortableNavGroup = SortableContainer(
  ({ children }: PropsWithChildren<{}>) => (
    <div className="list-group mb-3">{children}</div>
  )
);

interface NavItemProps<T extends MaterialSampleFormSectionId> {
  section: ScrollTarget<T>;
  disableRemovePrompt?: boolean;
  disableSwitch?: boolean;
}

const SortableNavItem = SortableElement(
  ({
    section,
    disableRemovePrompt,
    disableSwitch
  }: NavItemProps<MaterialSampleFormSectionId>) => {
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
        <NavSortHandle />
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
);

const NavSortHandle = SortableHandle(() => (
  <GiHamburgerMenu cursor="grab" size="2em" />
));

// Drag/drop re-ordering support copied from https://github.com/JedWatson/react-select/pull/3645/files
function arrayMove<T>(array: T[], from: number, to: number) {
  array = array.slice();
  array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
  return array;
}
