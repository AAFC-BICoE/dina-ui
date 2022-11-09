import classNames from "classnames";
import {
  FieldSet,
  QueryState,
  useBulkEditTabFieldIndicators,
  useDinaFormContext,
  useFieldLabels,
  withResponse
} from "common-ui";
import { KitsuResource, PersistedResource } from "kitsu";
import Link from "next/link";
import { ReactNode } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage } from "../../intl/dina-ui-intl";

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
  legend: JSX.Element;
  hideLinkerTab?: boolean;
}

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
  targetType,
  fieldSetId,
  legend,
  hideLinkerTab
}: TabbedResourceLinkerProps<T>) {
  const { isTemplate } = useDinaFormContext();

  const bulkCtx = useBulkEditTabFieldIndicators({
    fieldName,
    currentValue: resourceIdProp ? { id: resourceIdProp } : undefined
  });
  const isInBulkEditTab = !!bulkCtx;
  const { getFieldLabel } = useFieldLabels();

  // In bulk edit mode, show the common value if there is one instead of a new linked resource:
  const defaultValue = bulkCtx?.defaultValue;
  const resourceId = resourceIdProp ?? bulkCtx?.defaultValue?.id ?? null;

  const resourceQuery = useResourceQuery(resourceId);

  return (
    <FieldSet
      id={fieldSetId}
      legend={
        <div className={classNames(bulkCtx && "has-bulk-edit-value")}>
          <div className="field-label">{legend}</div>
        </div>
      }
    >
      {bulkCtx?.placeholder && (
        <div className={bulkCtx?.bulkEditClasses}>
          <div className="alert alert-secondary placeholder-text">
            {bulkCtx?.placeholder}
          </div>
        </div>
      )}
      {isInBulkEditTab && (
        <div className="alert alert-warning">
          <DinaMessage
            id="bulkEditResourceLinkerWarningSingle"
            values={{
              targetType: getFieldLabel({ name: targetType }).fieldLabel,
              fieldName: getFieldLabel({ name: fieldName }).fieldLabel
            }}
          />
        </div>
      )}
      <Tabs
        // Re-initialize the form when the linked resource changes:
        key={resourceId}
        // Prevent unmounting the form on tab switch to avoid losing the form state:
        forceRenderTabPanel={true}
      >
        <TabList>
          <Tab>
            {resourceId ? (
              <DinaMessage id="attached" />
            ) : (
              <DinaMessage id="createNew" />
            )}
          </Tab>
          {!hideLinkerTab && (
            <Tab disabled={disableLinkerTab}>
              <DinaMessage id="attachExisting" />
            </Tab>
          )}
        </TabList>
        <TabPanel>
          {
            // If there is already a linked resource then wait for it to load first:
            resourceId
              ? withResponse(resourceQuery, ({ data: linkedResource }) => (
                  <>
                    <div className="mb-3 d-flex justify-content-end align-items-center">
                      <Link href={`${readOnlyLink}${linkedResource.id}`}>
                        <a>
                          <DinaMessage id="detailsPageLink" />
                        </a>
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
                            <DinaMessage id="attached" />:{" "}
                            <Link href={`${readOnlyLink}${resourceId}`}>
                              <a>{linkedResource.id}</a>
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
        <TabPanel>{linkerTabContent}</TabPanel>
      </Tabs>
    </FieldSet>
  );
}
