import classNames from "classnames";
import {
  AreYouSureModal,
  FieldSpy,
  useBulkEditTabContext,
  useModal
} from "common-ui";
import dynamic from "next/dynamic";
import Switch from "react-switch";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  Determination,
  MaterialSampleAssociation
} from "../../../types/collection-api";
import { useMaterialSampleSave } from "./useMaterialSample";

export interface MaterialSampleNavProps {
  dataComponentState: ReturnType<
    typeof useMaterialSampleSave
  >["dataComponentState"];
  disableRemovePrompt?: boolean;
}

const renderNav = process.env.NODE_ENV !== "test";

const ScrollSpyNav = renderNav
  ? dynamic(
      async () => {
        const NavClass = await import("react-scrollspy-nav");

        // Put the "active" class on the list-group-item instead of the <a> tag:
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

/** Form navigation and toggles to enable/disable form sections. */
export function MaterialSampleFormNav({
  dataComponentState,
  disableRemovePrompt
}: MaterialSampleNavProps) {
  const { formatMessage } = useDinaIntl();
  const { openModal } = useModal();

  const scrollTargets = [
    { id: "identifiers-section", msg: <DinaMessage id="identifiers" /> },
    {
      id: "collecting-event-section",
      msg: formatMessage("collectingEvent"),
      className: "enable-collecting-event",
      disabled: !dataComponentState.enableCollectingEvent,
      setEnabled: dataComponentState.setEnableCollectingEvent
    },
    {
      id: "acquisition-event-section",
      msg: formatMessage("acquisitionEvent"),
      className: "enable-acquisition-event",
      disabled: !dataComponentState.enableAcquisitionEvent,
      setEnabled: dataComponentState.setEnableAcquisitionEvent
    },
    {
      id: "preparations-section",
      msg: formatMessage("preparations"),
      className: "enable-catalogue-info",
      disabled: !dataComponentState.enablePreparations,
      setEnabled: dataComponentState.setEnablePreparations
    },
    {
      id: "organism-state-section",
      msg: formatMessage("organismState"),
      className: "enable-organism-state",
      disabled: !dataComponentState.enableOrganism,
      setEnabled: dataComponentState.setEnableOrganism
    },
    {
      id: "determination-section",
      msg: formatMessage("determination"),
      className: "enable-determination",
      disabled: !dataComponentState.enableDetermination,
      setEnabled: dataComponentState.setEnableDetermination,
      customSwitch: DeterminationSwitch
    },
    {
      id: "associations-section",
      msg: formatMessage("associationsLegend"),
      className: "enable-associations",
      disabled: !dataComponentState.enableAssociations,
      setEnabled: dataComponentState.setEnableAssociations,
      customSwitch: AssociationsSwitch
    },
    {
      id: "storage-section",
      msg: formatMessage("storage"),
      className: "enable-storage",
      disabled: !dataComponentState.enableStorage,
      setEnabled: dataComponentState.setEnableStorage
    },
    {
      id: "scheduled-actions-section",
      msg: formatMessage("scheduledActions"),
      className: "enable-scheduled-actions",
      disabled: !dataComponentState.enableScheduledActions,
      setEnabled: dataComponentState.setEnableScheduledActions
    },
    {
      id: "managedAttributes-section",
      msg: formatMessage("managedAttributeListTitle")
    },
    {
      id: "material-sample-attachments-section",
      msg: formatMessage("materialSampleAttachments")
    }
  ];

  return (
    <div className="sticky-md-top material-sample-nav">
      <style>{`.material-sample-nav .active a { color: inherit !important; }`}</style>
      <ScrollSpyNav
        {...(renderNav
          ? {
              key: scrollTargets.filter(it => !it.disabled).length,
              scrollTargetIds: scrollTargets
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
          <div className="list-group">
            {scrollTargets.map(section => {
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
                    "list-group-item d-flex align-items-center"
                  )}
                  key={section.id}
                  style={{ height: "3rem" }}
                >
                  <Tag
                    className="flex-grow-1 text-decoration-none"
                    href={section.disabled ? undefined : `#${section.id}`}
                  >
                    {section.msg}
                  </Tag>
                  {section.setEnabled && (
                    <SwitchComponent
                      checked={!section.disabled}
                      onChange={toggle}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </ScrollSpyNav>
    </div>
  );
}

/** The determinations switch adds an initial determination if there isn't one already. */
function DeterminationSwitch(props) {
  const bulkTabCtx = useBulkEditTabContext();

  return (
    <FieldSpy<Determination[]> fieldName="determination">
      {(determination, { form: { setFieldValue } }) => (
        <Switch
          {...props}
          onChange={newVal => {
            props.onChange?.(newVal);
            if (!bulkTabCtx && newVal && !determination?.length) {
              setFieldValue("determination", [
                { isPrimary: true, isFileAs: true }
              ]);
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
