import classNames from "classnames";
import {
  FieldSet,
  QueryState,
  useBulkEditTabFieldIndicators,
  useDinaFormContext,
  withResponse
} from "common-ui";
import { KitsuResource, PersistedResource } from "kitsu";
import Link from "next/link";
import { CSSProperties, ReactNode } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { FaLink, FaUnlink } from "react-icons/fa";
import { FaLocationDot, FaPlus } from "react-icons/fa6";

export interface TabbedResourceLinkerProps<T extends KitsuResource> {
  resourceId?: string | null;
  setResourceId: (newId: string | null) => void;
  useResourceQuery: (id: string) => QueryState<T, undefined>;
  readOnlyLink?: string;
  disableLinkerTab?: boolean;
  nestedForm: (initialValues?: PersistedResource<T>) => ReactNode;
  linkerTabContent: ReactNode;
  briefDetails: (resource: PersistedResource<T>) => ReactNode;
  fieldName: string;
  targetType: string;
  /** FieldSet id */
  fieldSetId: string;
  /** FieldSet legend */
  legend: React.JSX.Element;
  hideLinkerTab?: boolean;
  hideCreateNewTab?: boolean;
  onUnlinkAll?: () => void;
}

// Shared styling for the TabPanels to maintain a unified 3px border & rounded container
const tabPanelStyle: CSSProperties = {
  backgroundColor: "#fff",
  border: "1px solid #aaaaaa",
  borderRadius: "5px",
  padding: "1rem",
  position: "relative",
  zIndex: 1,
  marginBottom: "1rem"
};

/** Tabbed view for a nested form where you can either add/edit a resource or link an existing one. */
export function TabbedResourceLinker<T extends KitsuResource>({
  resourceId: resourceIdProp,
  setResourceId,
  readOnlyLink,
  useResourceQuery,
  disableLinkerTab,
  nestedForm,
  linkerTabContent,
  briefDetails,
  fieldName,
  fieldSetId,
  legend,
  hideLinkerTab,
  hideCreateNewTab,
  onUnlinkAll
}: TabbedResourceLinkerProps<T>) {
  const { isTemplate } = useDinaFormContext();

  const bulkCtx = useBulkEditTabFieldIndicators({
    fieldName,
    currentValue: resourceIdProp ? { id: resourceIdProp } : undefined
  });

  // In bulk edit mode, show the common value if there is one instead of a new linked resource:
  const defaultValue = bulkCtx?.defaultValue;
  const resourceId = resourceIdProp ?? bulkCtx?.defaultValue?.id ?? null;

  const resourceQuery = useResourceQuery(resourceId);

  // Render main tab if there is an attached resource OR if creation is allowed
  const showMainTab = Boolean(resourceId) || !hideCreateNewTab;
  const showLinkerTab = !hideLinkerTab;

  const handleUnlinkAll = () => {
    if (onUnlinkAll) {
      onUnlinkAll();
    }
  };

  // Determine which DinaMessage ID to display based on the bulkCtx state
  const getBulkEditMessageId = () => {
    if (!bulkCtx) return null;

    if (bulkCtx.defaultValue || bulkCtx.defaultValue?.id) {
      return "sameCollectingEventAttached";
    }

    if (
      bulkCtx.bulkEditClasses?.includes("has-multiple-values") ||
      bulkCtx.placeholder === "Multiple Values"
    ) {
      return "mixedCollectingEventAttached";
    }

    return "noCollectingEventAttached";
  };
  const bulkEditMessageId = getBulkEditMessageId();

  return (
    <FieldSet
      id={fieldSetId}
      legend={
        <div className={classNames(bulkCtx && "has-bulk-edit-value")}>
          <div className="field-label">{legend}</div>
        </div>
      }
    >
      {/* Bulk Edit Alert */}
      {bulkCtx && (
        <div className="alert alert-info">
          <DinaMessage id="editingMaterialSamples" values={{ count: 5 }} />{" "}
          <DinaMessage id={bulkEditMessageId as any} />
        </div>
      )}

      {/* Only render Tabs if at least one tab is visible */}
      {(showMainTab || showLinkerTab) && (
        <Tabs
          // Re-initialize the form when the linked resource changes:
          key={resourceId}
          // Prevent unmounting the form on tab switch to avoid losing the form state:
          forceRenderTabPanel={true}
        >
          <TabList
            className="d-flex justify-content-between align-items-center ps-2 mb-0"
            style={{
              position: "relative",
              zIndex: 2,
              marginBottom: "-3px" // Pulls the TabPanel up so active tab overlays the top 3px border seamlessly
            }}
          >
            <div className="d-flex align-items-center">
              {showMainTab && (
                <Tab>
                  {resourceId ? (
                    <>
                      <FaLocationDot className="me-2" />
                      <DinaMessage id="linked" />
                    </>
                  ) : (
                    <>
                      <FaPlus className="me-2" />
                      <DinaMessage id="createNew" />
                    </>
                  )}
                </Tab>
              )}
              {showLinkerTab && (
                <Tab disabled={disableLinkerTab}>
                  <FaLink className="me-2" />
                  <DinaMessage id="linkExisting" />
                </Tab>
              )}
            </div>

            {/* Unlink All button aligned to the right end of the tab bar */}
            {!disableLinkerTab && (
              <button
                type="button"
                className="btn btn-danger btn-sm mb-1"
                onClick={handleUnlinkAll}
              >
                <FaUnlink className="me-2" />
                <DinaMessage id="unlinkAll" />
              </button>
            )}
          </TabList>

          {showMainTab && (
            <TabPanel style={tabPanelStyle}>
              {
                // If there is already a linked resource then wait for it to load first:
                resourceId
                  ? withResponse(resourceQuery, ({ data: linkedResource }) => (
                      <>
                        <div className="mb-3 d-flex justify-content-end align-items-center">
                          <Link href={`${readOnlyLink}${linkedResource.id}`}>
                            <DinaMessage id="detailsPageLink" />
                          </Link>
                          {
                            // Do not allow changing an attached resource from a template:
                            !disableLinkerTab && (
                              <button
                                type="button"
                                className="btn btn-danger detach-resource-button ms-5"
                                onClick={() => setResourceId(null)}
                              >
                                <DinaMessage id="detach" />
                              </button>
                            )
                          }
                        </div>
                        {
                          // In template mode or Workflow Run mode, only show a link to the linked resource:
                          isTemplate || disableLinkerTab ? (
                            <div>
                              <div className="attached-resource-link mb-3">
                                <DinaMessage id="linked" />:{" "}
                                <Link href={`${readOnlyLink}${resourceId}`}>
                                  {linkedResource.id}
                                </Link>
                              </div>
                              {briefDetails(
                                (linkedResource as PersistedResource<T>) ||
                                  defaultValue
                              )}
                            </div>
                          ) : (
                            // In form mode, show the actual editable resource form:
                            nestedForm(
                              (linkedResource as PersistedResource<T>) ||
                                defaultValue
                            )
                          )
                        }
                      </>
                    ))
                  : nestedForm()
              }
            </TabPanel>
          )}

          {showLinkerTab && (
            <TabPanel style={tabPanelStyle}>{linkerTabContent}</TabPanel>
          )}
        </Tabs>
      )}
    </FieldSet>
  );
}
