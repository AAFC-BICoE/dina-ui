import classNames from "classnames";
import {
  ExternalLink,
  FieldSet,
  QueryState,
  Tooltip,
  useBulkEditTabFieldIndicators,
  useDinaFormContext,
  useModal,
  AreYouSureModal,
  withResponse
} from "common-ui";
import { KitsuResource, PersistedResource } from "kitsu";
import {
  ReactNode,
  useState,
  useEffect,
  Dispatch,
  SetStateAction
} from "react";
import { Nav } from "react-bootstrap";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { FaLink, FaUnlink } from "react-icons/fa";
import {
  FaCheck,
  FaCircleInfo,
  FaLinkSlash,
  FaMagnifyingGlass,
  FaPlus,
  FaTriangleExclamation
} from "react-icons/fa6";
import styles from "./TabbedResourceLinker.module.css";

export interface TabbedResourceLinkerProps<T extends KitsuResource> {
  resourceId?: string | null;
  setResourceId?: (newId: string | null) => void;
  useResourceQuery: (id: string) => QueryState<T, undefined>;
  readOnlyLink?: string;
  disableLinkerTab?: boolean;
  nestedForm: (
    initialValues?: PersistedResource<T>,
    forceReadOnly?: boolean
  ) => ReactNode;
  linkerTabContent: ReactNode;
  fieldName: string;
  targetType: string;
  /** FieldSet id */
  fieldSetId: string;
  /** FieldSet legend */
  legend: React.JSX.Element;
  hideLinkerTab?: boolean;
  hideCreateNewTab?: boolean;
  onTabSelect?: (index: number) => void;
  unlinkCollectingEvent?: boolean;
  setUnlinkCollectingEvent?: Dispatch<SetStateAction<boolean>>;
  overrideCollectingEvent?: boolean;
  /** The number of records sharing the linked resource. */
  usageCount?: number | null;
  /** The name and date shown in the linked resource summary bar. */
  getSummary?: (resource: PersistedResource<T>) => {
    name?: ReactNode;
    date?: string | null;
  };
}

/**
 * Compact bar at the top of the linked tab: what is linked, how widely it is shared, and the
 * details link / unlink button.
 */
function LinkedResourceSummary({
  name,
  date,
  usageCount,
  readOnlyLink,
  resourceId,
  disableUnlink,
  onUnlink,
  bulkEditView
}: {
  name?: ReactNode;
  date?: string | null;
  usageCount?: number | null;
  readOnlyLink?: string;
  resourceId: string;
  disableUnlink?: boolean;
  onUnlink: () => void;
  bulkEditView: boolean;
}) {
  const { formatMessage } = useDinaIntl();
  const isShared = !!usageCount && usageCount > 1;

  return (
    <div
      className={classNames(
        styles.summaryBar,
        "d-flex flex-wrap align-items-center gap-3 mb-4"
      )}
    >
      <FaLink size={13} style={{ color: "var(--dina-navy, #335075)" }} />
      <span className={styles.summaryText}>
        <DinaMessage id="linkedToResource" /> <b>{name ?? resourceId}</b>
        {date && <> · {date}</>}
        {isShared && (
          <>
            {" "}
            ·{" "}
            <DinaMessage
              id="sharedWithMaterialSamples"
              values={{ count: usageCount }}
            />
          </>
        )}
      </span>
      {isShared && (
        <Tooltip
          directText={formatMessage("collectingEventEditOnDetailsPage")}
        />
      )}
      <div className="flex-grow-1" />
      {readOnlyLink && (
        <ExternalLink href={`${readOnlyLink}${resourceId}`}>
          <DinaMessage id="detailsPageLink" />
        </ExternalLink>
      )}
      {!disableUnlink && (
        <button
          type="button"
          className="btn btn-danger btn-sm unlink-resource-button"
          onClick={onUnlink}
        >
          <FaLinkSlash className="me-2" />
          <DinaMessage id={bulkEditView ? "unlinkAll" : "unlink"} />
        </button>
      )}
    </div>
  );
}

export function TabbedResourceLinker<T extends KitsuResource>({
  resourceId: resourceIdProp,
  setResourceId,
  readOnlyLink,
  useResourceQuery,
  disableLinkerTab,
  nestedForm,
  linkerTabContent,
  fieldName,
  fieldSetId,
  legend,
  hideLinkerTab,
  hideCreateNewTab,
  onTabSelect,
  unlinkCollectingEvent,
  setUnlinkCollectingEvent,
  overrideCollectingEvent,
  usageCount,
  getSummary
}: TabbedResourceLinkerProps<T>) {
  const { isTemplate, isBulkEditAllTab } = useDinaFormContext();
  const { openModal } = useModal();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const bulkCtx = useBulkEditTabFieldIndicators({
    fieldName,
    currentValue: resourceIdProp ? { id: resourceIdProp } : undefined
  });

  // Determine bulk edit states
  const hasSameValue = Boolean(
    bulkCtx?.defaultValue || bulkCtx?.defaultValue?.id
  );
  const hasMixedValues =
    Boolean(bulkCtx) &&
    !hasSameValue &&
    (bulkCtx?.bulkEditClasses?.includes("has-multiple-values") ||
      bulkCtx?.placeholder === "Multiple Values");

  // In bulk edit mode, resolve the effective resource ID
  const defaultValue = bulkCtx?.defaultValue;

  // Only fallback to defaultValue?.id on the "Edit All" tab (when hideCreateNewTab is true).
  // On individual record edit tabs (hideCreateNewTab is false), respect resourceIdProp strictly.
  const resourceId = hideCreateNewTab
    ? resourceIdProp ?? defaultValue?.id ?? null
    : resourceIdProp ?? null;

  // Reset unlinked state if a new resource ID is supplied
  useEffect(() => {
    if (resourceIdProp) {
      setUnlinkCollectingEvent?.(false);
      setSelectedIndex(0);
    }
  }, [resourceIdProp]);

  const resourceQuery = useResourceQuery(resourceId ?? "");

  // Check if there is currently an attached/linked resource (either single or mixed)
  const hasAttachedResource =
    !unlinkCollectingEvent &&
    (Boolean(resourceId) || (hideCreateNewTab && hasMixedValues));

  // Tab visibility rules:
  const showLinkedTab = hasAttachedResource;
  const showCreateTab = !hideCreateNewTab;
  const showLinkerTab = !hideLinkerTab;

  const performUnlink = () => {
    if (setUnlinkCollectingEvent) {
      setUnlinkCollectingEvent(true);
    }
    if (setResourceId) {
      setResourceId(null);
    }
  };

  const confirmUnlink = () => {
    openModal(
      <AreYouSureModal
        actionMessage={<DinaMessage id="unlinkAllTitle" />}
        messageBody={<DinaMessage id="unlinkAllBody" />}
        onYesButtonClicked={performUnlink}
      />
    );
  };

  const tabs = [
    showLinkedTab && {
      icon: <FaLink />,
      label: <DinaMessage id="linked" />,
      disabled: false
    },
    showCreateTab && {
      icon: <FaPlus />,
      label: <DinaMessage id="createNew" />,
      disabled: false
    },
    showLinkerTab && {
      icon: <FaMagnifyingGlass />,
      label: <DinaMessage id="linkExisting" />,
      disabled: Boolean(disableLinkerTab)
    }
  ].flatMap((tab, index) =>
    tab
      ? [{ ...tab, key: (["linked", "create", "linker"] as const)[index] }]
      : []
  );
  const activeIndex = Math.min(selectedIndex, Math.max(tabs.length - 1, 0));
  const activeTab = tabs[activeIndex]?.key;

  const tabStrip =
    !unlinkCollectingEvent && tabs.length > 0 ? (
      <Nav
        variant="tabs"
        role="tablist"
        className={styles.headerTabs}
        activeKey={String(activeIndex)}
        onSelect={(key) => {
          const index = Number(key);
          setSelectedIndex(index);
          onTabSelect?.(index);
        }}
      >
        {tabs.map((tab, index) => (
          <Nav.Item key={tab.key} role="presentation">
            <Nav.Link
              as="button"
              type="button"
              role="tab"
              eventKey={String(index)}
              disabled={tab.disabled}
              aria-selected={index === activeIndex}
            >
              {tab.icon}
              <span className="ms-2">{tab.label}</span>
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
    ) : null;

  return (
    <FieldSet
      id={fieldSetId}
      className={styles.linkerFieldSet}
      legend={
        <div className={classNames(bulkCtx && "has-bulk-edit-value")}>
          <div className="field-label">{legend}</div>
        </div>
      }
      wrapLegend={(legendElement) => (
        <>
          {legendElement}
          {tabStrip}
        </>
      )}
    >
      {/* Alert banner displayed after unlinking, informing the user that changes apply on save */}
      {unlinkCollectingEvent && (
        <div
          className="alert alert-warning d-flex align-items-center gap-2 mb-3"
          role="alert"
        >
          <FaTriangleExclamation className="flex-shrink-0" />
          <span>
            <DinaMessage id="unlinkAllNotice" />
          </span>
        </div>
      )}

      {!unlinkCollectingEvent && activeTab === "linked" && (
        <div role="tabpanel">
          {hasMixedValues && !overrideCollectingEvent ? (
            <div
              className="alert alert-info d-flex align-items-center justify-content-between gap-2 mb-0"
              role="alert"
            >
              <div className="d-flex align-items-center gap-2">
                <FaCircleInfo className="flex-shrink-0" />
                <span>
                  <DinaMessage id="mixedCollectingEventAttached" />
                </span>
              </div>
              {!disableLinkerTab && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm text-nowrap"
                  onClick={() => confirmUnlink()}
                >
                  <FaUnlink className="me-2" />
                  <DinaMessage id="unlinkAll" />
                </button>
              )}
            </div>
          ) : (
            resourceId &&
            withResponse(resourceQuery, ({ data: linkedResource }) => {
              const activeResource =
                (linkedResource as PersistedResource<T>) || defaultValue;
              const isReadOnlyMode =
                isTemplate ||
                disableLinkerTab ||
                isBulkEditAllTab ||
                overrideCollectingEvent;
              const summary = getSummary?.(activeResource);

              return (
                <>
                  <LinkedResourceSummary
                    name={summary?.name}
                    date={summary?.date}
                    usageCount={usageCount}
                    readOnlyLink={readOnlyLink}
                    resourceId={resourceId}
                    disableUnlink={disableLinkerTab}
                    onUnlink={() => confirmUnlink()}
                    bulkEditView={Boolean(hasSameValue && hideCreateNewTab)}
                  />

                  {/* Show info alert when all bulk-edited samples share the same event */}
                  {hasSameValue &&
                    hideCreateNewTab &&
                    !overrideCollectingEvent && (
                      <div
                        className="alert alert-info d-flex align-items-center gap-2 py-2 px-3 mb-3"
                        role="alert"
                      >
                        <FaCircleInfo className="flex-shrink-0" />
                        <span>
                          <DinaMessage id="sameCollectingEventAttached" />
                        </span>
                      </div>
                    )}

                  {/* Show alert indicating that the following collecting event will override once saved */}
                  {overrideCollectingEvent && (
                    <div
                      className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 mb-3"
                      role="alert"
                    >
                      <FaCheck className="flex-shrink-0" />
                      <span>
                        <DinaMessage
                          id={
                            hideCreateNewTab
                              ? "overrideCollectingEventBulk"
                              : "overrideCollectingEvent"
                          }
                        />
                      </span>
                    </div>
                  )}

                  {isReadOnlyMode ? (
                    <div>{nestedForm(activeResource, true)}</div>
                  ) : (
                    nestedForm(activeResource, false)
                  )}
                </>
              );
            })
          )}
        </div>
      )}

      {!unlinkCollectingEvent && activeTab === "create" && (
        <div role="tabpanel">
          {hasAttachedResource && (
            <div
              className="alert alert-warning d-flex align-items-center gap-2 mb-3"
              role="alert"
            >
              <FaTriangleExclamation className="flex-shrink-0" />
              <span>
                <DinaMessage id="createNewLinkNotice" />
              </span>
            </div>
          )}
          {nestedForm(undefined, false)}
        </div>
      )}

      {!unlinkCollectingEvent && activeTab === "linker" && (
        <div role="tabpanel">
          {hasAttachedResource && (
            <div
              className="alert alert-warning d-flex align-items-center gap-2 mb-3"
              role="alert"
            >
              <FaTriangleExclamation className="flex-shrink-0" />
              <span>
                <DinaMessage id="replaceExistingLinkNotice" />
              </span>
            </div>
          )}
          {linkerTabContent}
        </div>
      )}
    </FieldSet>
  );
}
