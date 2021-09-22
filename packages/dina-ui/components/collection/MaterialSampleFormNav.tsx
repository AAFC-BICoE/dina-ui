import classNames from "classnames";
import dynamic from "next/dynamic";
import Switch from "react-switch";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { useMaterialSampleSave } from "./useMaterialSample";

export interface MaterialSampleNavProps {
  dataComponentState: ReturnType<
    typeof useMaterialSampleSave
  >["dataComponentState"];
}

const ScrollSpyNav =
  process.env.NODE_ENV === "test"
    ? ("div" as any)
    : dynamic<any>(() => import("react-scrollspy-nav"), {
        ssr: false
      });

/** Form navigation and toggles to enable/disable form sections. */
export function MaterialSampleFormNav({
  dataComponentState
}: MaterialSampleNavProps) {
  const { formatMessage } = useDinaIntl();

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
      id: "preparations-section",
      msg: formatMessage("preparations"),
      className: "enable-catalogue-info",
      disabled: !dataComponentState.enablePreparations,
      setEnabled: dataComponentState.setEnablePreparations
    },
    {
      id: "determination-section",
      msg: formatMessage("determination"),
      className: "enable-determination",
      disabled: !dataComponentState.enableDetermination,
      setEnabled: dataComponentState.setEnableDetermination
    },
    {
      id: "storage-section",
      msg: formatMessage("storage"),
      className: "enable-storage",
      disabled: !dataComponentState.enableStorage,
      setEnabled: dataComponentState.setEnableStorage
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
    <ScrollSpyNav
      key={scrollTargets.filter(it => !it.disabled).length}
      scrollTargetIds={scrollTargets
        .filter(it => !it.disabled)
        .map(it => it.id)}
      activeNavClass="active"
      offset={-20}
      scrollDuration="100"
    >
      <nav className="card card-body sticky-md-top">
        <h3>
          <DinaMessage id="dataComponents" />
        </h3>
        <div className="list-group">
          {scrollTargets.map(section => {
            const Tag = section.disabled ? "div" : "a";
            return (
              <Tag
                key={section.id}
                className={classNames(
                  "d-flex list-group-item",
                  section.className
                )}
                href={section.disabled ? undefined : `#${section.id}`}
              >
                {section.msg}
                {section.setEnabled && (
                  <Switch
                    className="ms-auto"
                    checked={!section.disabled}
                    onChange={dataComponentState.dataComponentToggler(
                      section.setEnabled,
                      section.msg
                    )}
                  />
                )}
              </Tag>
            );
          })}
        </div>
      </nav>
    </ScrollSpyNav>
  );
}
