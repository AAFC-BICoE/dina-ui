import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import {
  AreYouSureModal,
  SmallSwitch,
  Tooltip,
  useDinaFormContext,
  useModal
} from "common-ui";
import {
  ComponentType,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState
} from "react";
import { FaGripLines } from "react-icons/fa";
import {
  FaBoxArchive,
  FaBug,
  FaCalendarDays,
  FaCircleInfo,
  FaFingerprint,
  FaFlask,
  FaLink,
  FaLocationDot,
  FaLock,
  FaPaperclip,
  FaPuzzlePiece,
  FaQuoteRight,
  FaSliders
} from "react-icons/fa6";
import { IconType } from "react-icons";
import { ReactSwitchProps } from "react-switch";
import { DinaMessage } from "../../../../intl/dina-ui-intl";
import {
  ASSOCIATIONS_COMPONENT_NAME,
  CITATIONS_COMPONENT_NAME,
  COLLECTING_EVENT_COMPONENT_NAME,
  FIELD_EXTENSIONS_COMPONENT_NAME,
  IDENTIFIER_COMPONENT_NAME,
  MANAGED_ATTRIBUTES_COMPONENT_NAME,
  MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME,
  MATERIAL_SAMPLE_INFO_COMPONENT_NAME,
  ORGANISMS_COMPONENT_NAME,
  PREPARATIONS_COMPONENT_NAME,
  RESTRICTION_COMPONENT_NAME,
  SCHEDULED_ACTIONS_COMPONENT_NAME,
  STORAGE_COMPONENT_NAME
} from "../../../../types/collection-api";
import { useMaterialSampleSave } from "../useMaterialSample";
import { useMaterialSampleSectionOrder } from "./useMaterialSampleSectionOrder";
import { NativeScrollSpyNav } from "./NativeScrollSpyNav";

export interface MaterialSampleFormNavProps {
  dataComponentState: ReturnType<
    typeof useMaterialSampleSave
  >["dataComponentState"];

  /** Disabled the Are You Sure modal when toggling a data component off. */
  disableRemovePrompt?: boolean;

  // Disables Collecting Event React Switch for child material samples
  disableCollectingEventSwitch?: boolean;

  /**
   * The current order that should be applied. This should come from a form template.
   */
  navOrder?: string[] | null;

  /**
   * This should only be used when editing a form template. Returns the new order of the
   * navigation.
   */
  onChangeNavOrder?: (newOrder: string[] | null) => void;

  /**
   * Are we currently editing a form template?
   */
  isTemplate: boolean;
}

// Don't render the scroll-spy component during tests because it only works in the browser.
const renderNav = process.env.NODE_ENV !== "test";

const ScrollSpyNav = renderNav ? NativeScrollSpyNav : "div";

const FORM_SECTION_HOVER_CLASS = "nav-hover-highlight";

function setFormSectionHovered(targetId: string, hovered: boolean) {
  document
    .getElementById(targetId)
    ?.classList.toggle(FORM_SECTION_HOVER_CLASS, hovered);
}

export interface ScrollTarget {
  id: string;
  msg: string | React.JSX.Element;
  className?: string;
  disabled?: boolean;
  setEnabled?: (val: boolean) => void;
  setDeleted?: (val: boolean) => void;
  customSwitch?: ComponentType<ReactSwitchProps>;
}

interface SubNavLink {
  id: string;
  msg: React.JSX.Element;
}

const SECTION_ICONS: Partial<Record<string, IconType>> = {
  [IDENTIFIER_COMPONENT_NAME]: FaFingerprint,
  [MATERIAL_SAMPLE_INFO_COMPONENT_NAME]: FaCircleInfo,
  [COLLECTING_EVENT_COMPONENT_NAME]: FaLocationDot,
  [PREPARATIONS_COMPONENT_NAME]: FaFlask,
  [ORGANISMS_COMPONENT_NAME]: FaBug,
  [ASSOCIATIONS_COMPONENT_NAME]: FaLink,
  [STORAGE_COMPONENT_NAME]: FaBoxArchive,
  [RESTRICTION_COMPONENT_NAME]: FaLock,
  [SCHEDULED_ACTIONS_COMPONENT_NAME]: FaCalendarDays,
  [CITATIONS_COMPONENT_NAME]: FaQuoteRight,
  [FIELD_EXTENSIONS_COMPONENT_NAME]: FaPuzzlePiece,
  [MANAGED_ATTRIBUTES_COMPONENT_NAME]: FaSliders,
  [MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME]: FaPaperclip
};

/** Sub-links shown under a top-level nav item while it's the active scroll target. */
const SECTION_SUB_LINKS: Partial<Record<string, SubNavLink[]>> = {
  [IDENTIFIER_COMPONENT_NAME]: [
    { id: "identifiers-main", msg: <DinaMessage id="identifiers" /> },
    { id: "identifiers-ownership", msg: <DinaMessage id="ownership" /> },
    {
      id: "identifiers-relationships",
      msg: <DinaMessage id="relationshipsAndTags" />
    },
    {
      id: "identifiers-releasable",
      msg: <DinaMessage id="publiclyReleasable" />
    }
  ],
  [ORGANISMS_COMPONENT_NAME]: [
    {
      id: "organism-managed-attributes",
      msg: <DinaMessage id="organismManagedAttributes" />
    },
    {
      id: "organism-verbatim-determination",
      msg: <DinaMessage id="verbatimDeterminationLegend" />
    },
    { id: "organism-type-specimen", msg: <DinaMessage id="typeSpecimen" /> },
    { id: "organism-determination", msg: <DinaMessage id="determination" /> },
    {
      id: "organism-determination-managed-attributes",
      msg: <DinaMessage id="determinationManagedAttributes" />
    }
  ],
  [ASSOCIATIONS_COMPONENT_NAME]: [
    {
      id: "associations-host-organism",
      msg: <DinaMessage id="hostOrganismLegend" />
    },
    {
      id: "associations-tabs",
      msg: <DinaMessage id="materialSampleAssociationLegend" />
    }
  ],
  [COLLECTING_EVENT_COMPONENT_NAME]: [
    { id: "identifiers", msg: <DinaMessage id="identifiers" /> },
    {
      id: "collectingDateLegend",
      msg: <DinaMessage id="collectingDateLegend" />
    },
    {
      id: "collectingAgentsLegend",
      msg: <DinaMessage id="collectingAgentsLegend" />
    },
    {
      id: "verbatimLabelLegend",
      msg: <DinaMessage id="verbatimLabelLegend" />
    },
    {
      id: "collectingEventDetails",
      msg: <DinaMessage id="collectingEventDetails" />
    },
    {
      id: "georeferencing",
      msg: <DinaMessage id="collectingEventGeoreferencing" />
    },
    {
      id: "geographicPlace",
      msg: <DinaMessage id="collectingEventGeographicPlace" />
    },
    {
      id: "collectingEventPartOfExpedition",
      msg: <DinaMessage id="collectingEventPartOfExpedition" />
    },
    {
      id: "collectingEventSite",
      msg: <DinaMessage id="collectingEventSite" />
    },
    {
      id: "collectingEventFieldExtensions",
      msg: <DinaMessage id="collectingEventFieldExtensions" />
    },
    {
      id: "collectingEventManagedAttributes",
      msg: <DinaMessage id="collectingEventManagedAttributes" />
    },
    {
      id: "collectingEventAttachments",
      msg: <DinaMessage id="collectingEventAttachments" />
    }
  ]
};

/** Form navigation and toggles to enable/disable form sections. */
export function MaterialSampleFormNav({
  dataComponentState,
  disableRemovePrompt,
  disableCollectingEventSwitch,
  navOrder,
  onChangeNavOrder,
  isTemplate
}: MaterialSampleFormNavProps) {
  const { sortedScrollTargets } = useMaterialSampleSectionOrder({
    dataComponentState,
    navOrder,
    isTemplate
  });

  const [items, setItems] = useState(sortedScrollTargets.map((it) => it.id));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.indexOf(active.id);
        const newIndex = prevItems.indexOf(over.id);
        return arrayMove(prevItems, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    onChangeNavOrder?.(items);
  }, [items]);

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="sticky-md-top material-sample-nav">
          <style>{`.material-sample-nav .active a { color: inherit !important; } .material-sample-nav { top: 72px; }`}</style>
          <ScrollSpyNav
            {...(renderNav
              ? {
                  key: sortedScrollTargets.filter((it) => !it.disabled).length,
                  scrollTargetIds: sortedScrollTargets
                    .filter((it) => !it.disabled)
                    .map((it) => it.id),
                  subScrollTargetIds: Object.values(SECTION_SUB_LINKS).flatMap(
                    (links) => links?.map((link) => link.id) ?? []
                  ),
                  activeNavClass: "active"
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
              <div className="list-group">
                <SortableNavGroup>
                  {sortedScrollTargets.map((section) => (
                    <DataComponentNavItem
                      id={section.id}
                      key={section.id}
                      section={section}
                      disableRemovePrompt={disableRemovePrompt}
                      disableSwitch={
                        section.id === COLLECTING_EVENT_COMPONENT_NAME &&
                        disableCollectingEventSwitch
                      }
                    />
                  ))}
                </SortableNavGroup>
              </div>
            </nav>
          </ScrollSpyNav>
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface NavItemProps {
  id: string;
  section: ScrollTarget;
  disableRemovePrompt?: boolean;
  disableSwitch?: boolean;
}

const DataComponentNavItem = ({
  id,
  section,
  disableRemovePrompt,
  disableSwitch
}: NavItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id
  });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1
    }),
    [transform, transition, isDragging]
  );

  const { openModal } = useModal();
  const { isTemplate } = useDinaFormContext();

  const Tag = section.disabled ? "div" : "a";
  const SwitchComponent = section.customSwitch ?? SmallSwitch;

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
          onYesButtonClicked={() => {
            section.setEnabled?.(newVal);
            section.setDeleted?.(true);
          }}
        />
      );
    } else {
      section.setEnabled?.(newVal);
      // When disableRemovePrompt is true (e.g. Edit All tab), we still need to mark
      // the section as deleted so its formik values are cleared and not applied as overrides.
      if (!newVal) {
        section.setDeleted?.(true);
      }
    }
  }

  const subLinks = SECTION_SUB_LINKS[section.id];

  // Cards can be missing (e.g. hidden by a form template), so only link to the ones rendered.
  const [renderedSubLinkIds, setRenderedSubLinkIds] = useState<string[]>([]);
  useEffect(() => {
    const ids = (subLinks ?? [])
      .filter((subLink) => document.getElementById(subLink.id))
      .map((subLink) => subLink.id);
    setRenderedSubLinkIds((previous) =>
      previous.join() === ids.join() ? previous : ids
    );
  });
  const visibleSubLinks = subLinks?.filter((subLink) =>
    renderedSubLinkIds.includes(subLink.id)
  );
  const SectionIcon = SECTION_ICONS[section.id];

  return (
    <div className="nav-item-group">
      <div
        ref={setNodeRef}
        {...attributes}
        data-dragging={isDragging}
        className={classNames(
          section.className,
          "list-group-item d-flex gap-2 align-items-center"
        )}
        key={section.id}
        style={{ ...style, height: "3rem", zIndex: 1030 }}
      >
        {isTemplate && <NavSortHandle {...listeners} isDragging={isDragging} />}
        <Tag
          className="flex-grow-1 text-decoration-none"
          href={section.disabled ? undefined : `#${section.id}`}
          onMouseEnter={() => setFormSectionHovered(section.id, true)}
          onMouseLeave={() => setFormSectionHovered(section.id, false)}
        >
          {SectionIcon && <SectionIcon className="nav-item-icon" />}
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
      {visibleSubLinks && !section.disabled && (
        <ul className="sub-nav-list list-unstyled">
          {visibleSubLinks.map((subLink) => (
            <li key={subLink.id}>
              <a
                href={`#${subLink.id}`}
                onMouseEnter={() => setFormSectionHovered(subLink.id, true)}
                onMouseLeave={() => setFormSectionHovered(subLink.id, false)}
              >
                {subLink.msg}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const SortableNavGroup = ({ children }: PropsWithChildren<{}>) => (
  <div className="list-group">{children}</div>
);

const NavSortHandle = (props) => (
  <FaGripLines
    {...props}
    cursor={props.isDragging ? "grabbing" : "grab"}
    size="1.5em"
  />
);
