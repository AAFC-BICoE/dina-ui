import classNames from "classnames";
import {
  ExternalLink,
  FieldSet,
  QueryState,
  useBulkEditTabFieldIndicators,
  useDinaFormContext,
  useModal,
  AreYouSureModal,
  withResponse
} from "common-ui";
import { KitsuResource, PersistedResource } from "kitsu";
import Link from "next/link";
import {
  CSSProperties,
  ReactNode,
  useState,
  useEffect,
  Dispatch,
  SetStateAction
} from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { FaLink, FaUnlink } from "react-icons/fa";
import {
  FaCheck,
  FaCircleInfo,
  FaLocationDot,
  FaPlus,
  FaTriangleExclamation
} from "react-icons/fa6";

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
}

const tabPanelStyle: CSSProperties = {
  backgroundColor: "#fff",
  border: "1px solid #aaaaaa",
  borderRadius: "5px",
  padding: "1rem",
  position: "relative",
  zIndex: 1,
  marginBottom: "1rem"
};

/**
 * Top control buttons (Details link & unlink button) for linked resources.
 */
function LinkedResourceHeaderActions({
  readOnlyLink,
  resourceId,
  disableUnlink,
  onUnlink,
  bulkEditView
}: {
  readOnlyLink?: string;
  resourceId: string;
  disableUnlink?: boolean;
  onUnlink: () => void;
  bulkEditView: boolean;
}) {
  return (
    <div className="d-flex justify-content-end align-items-center gap-3 mb-3">
      {readOnlyLink && (
        <ExternalLink
          href={`${readOnlyLink}${resourceId}`}
          className="btn btn-link p-0"
        >
          <DinaMessage id="detailsPageLink" />
        </ExternalLink>
      )}
      {!disableUnlink && (
        <button
          type="button"
          className="btn btn-danger btn-sm unlink-resource-button"
          onClick={onUnlink}
        >
          <FaUnlink className="me-2" />
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
  setUnlinkCollectingEvent
}: TabbedResourceLinkerProps<T>) {
  const { isTemplate, isBulkEditAllTab } = useDinaFormContext();
  const { openModal } = useModal();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isOveriding, setIsOveriding] = useState<boolean>(false);

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
      setIsOveriding(true);
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

  return (
    <FieldSet
      id={fieldSetId}
      legend={
        <div className={classNames(bulkCtx && "has-bulk-edit-value")}>
          <div className="field-label">{legend}</div>
        </div>
      }
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

      {!unlinkCollectingEvent &&
        (showLinkedTab || showCreateTab || showLinkerTab) && (
          <Tabs
            key={resourceId ?? (hasMixedValues ? "mixed" : "new")}
            selectedIndex={selectedIndex}
            onSelect={(index) => {
              setSelectedIndex(index);
              if (onTabSelect) {
                onTabSelect(index);
              }
            }}
            forceRenderTabPanel={false}
          >
            <TabList
              className="d-flex justify-content-between align-items-center ps-2 mb-0"
              style={{ position: "relative", zIndex: 2, marginBottom: "-3px" }}
            >
              <div className="d-flex align-items-center">
                {showLinkedTab && (
                  <Tab>
                    <FaLocationDot className="me-2" />
                    <DinaMessage id="linked" />
                  </Tab>
                )}
                {showCreateTab && (
                  <Tab>
                    <FaPlus className="me-2" />
                    <DinaMessage id="createNew" />
                  </Tab>
                )}
                {showLinkerTab && (
                  <Tab disabled={disableLinkerTab}>
                    <FaLink className="me-2" />
                    <DinaMessage id="linkExisting" />
                  </Tab>
                )}
              </div>
            </TabList>

            {showLinkedTab && (
              <TabPanel style={tabPanelStyle}>
                {hasMixedValues && !isOveriding ? (
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
                      isTemplate || disableLinkerTab || isBulkEditAllTab;

                    return (
                      <>
                        <LinkedResourceHeaderActions
                          readOnlyLink={readOnlyLink}
                          resourceId={resourceId}
                          disableUnlink={disableLinkerTab}
                          onUnlink={() => confirmUnlink()}
                          bulkEditView={Boolean(
                            hasSameValue && hideCreateNewTab
                          )}
                        />

                        {/* Show info alert when all bulk-edited samples share the same event */}
                        {hasSameValue && hideCreateNewTab && !isOveriding && (
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
                        {isOveriding && hideCreateNewTab && (
                          <div
                            className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 mb-3"
                            role="alert"
                          >
                            <FaCheck className="flex-shrink-0" />
                            <span>
                              <DinaMessage id="overrideCollectingEvent" />
                            </span>
                          </div>
                        )}

                        {isReadOnlyMode ? (
                          <div>
                            <div className="attached-resource-link mb-3">
                              <strong>
                                <DinaMessage id="linked" />:{" "}
                              </strong>
                              <Link href={`${readOnlyLink}${resourceId}`}>
                                {linkedResource.id}
                              </Link>
                            </div>
                            {nestedForm(activeResource, true)}
                          </div>
                        ) : (
                          nestedForm(activeResource, false)
                        )}
                      </>
                    );
                  })
                )}
              </TabPanel>
            )}

            {showCreateTab && (
              <TabPanel style={tabPanelStyle}>
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
              </TabPanel>
            )}

            {showLinkerTab && (
              <TabPanel style={tabPanelStyle}>
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
              </TabPanel>
            )}
          </Tabs>
        )}
    </FieldSet>
  );
}
