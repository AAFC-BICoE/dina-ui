import classNames from "classnames";
import {
  AreYouSureModal,
  Tooltip,
  useDinaFormContext,
  useModal
} from "common-ui";
import dynamic from "next/dynamic";
import { ComponentType, PropsWithChildren } from "react";
import Switch, { ReactSwitchProps } from "react-switch";
import { DinaMessage } from "../../../../intl/dina-ui-intl";
import { FaGripLines } from "react-icons/fa";
import {
  SortableContainer,
  SortableElement,
  SortableHandle,
  SortEnd
} from "react-sortable-hoc";
import { useMaterialSampleSave } from "../useMaterialSample";
import { useMaterialSampleSectionOrder } from "./useMaterialSampleSectionOrder";
import { COLLECTING_EVENT_COMPONENT_NAME } from "../../../../types/collection-api";

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

export interface ScrollTarget {
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
  navOrder,
  onChangeNavOrder,
  isTemplate
}: MaterialSampleFormNavProps) {
  const { sortedScrollTargets } = useMaterialSampleSectionOrder({
    dataComponentState,
    navOrder,
    isTemplate
  });

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
    ).map((it) => it.id);
    onChangeNavOrder?.(newOrder);
  }

  return (
    <div className="sticky-md-top material-sample-nav">
      <style>{`.material-sample-nav .active a { color: inherit !important; } .material-sample-nav { top: 70px; }`}</style>
      <ScrollSpyNav
        {...(renderNav
          ? {
              key: sortedScrollTargets.filter((it) => !it.disabled).length,
              scrollTargetIds: sortedScrollTargets
                .filter((it) => !it.disabled)
                .map((it) => it.id),
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
          <div className="list-group">
            <SortableNavGroup
              axis="y"
              useDragHandle={true}
              onSortStart={onSortStart}
              onSortEnd={onSortEnd}
            >
              {sortedScrollTargets.map((section, index) => (
                <DataComponentNavItem
                  key={section.id}
                  section={section}
                  index={index}
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
  );
}

interface NavItemProps {
  section: ScrollTarget;
  disableRemovePrompt?: boolean;
  disableSwitch?: boolean;
}

const DataComponentNavItem = SortableElement(
  ({ section, disableRemovePrompt, disableSwitch }: NavItemProps) => {
    const { openModal } = useModal();
    const { isTemplate } = useDinaFormContext();

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
        {isTemplate && <NavSortHandle />}
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

export const SortableNavGroup = SortableContainer(
  ({ children }: PropsWithChildren<{}>) => (
    <div className="list-group">{children}</div>
  )
);

const NavSortHandle = SortableHandle(() => (
  <FaGripLines cursor="grab" size="1.5em" />
));

// Drag/drop re-ordering support copied from https://github.com/JedWatson/react-select/pull/3645/files
function arrayMove<T>(array: T[], from: number, to: number) {
  array = array.slice();
  array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
  return array;
}
