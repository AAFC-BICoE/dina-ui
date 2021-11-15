import {
  FormikButton,
  QueryState,
  useDinaFormContext,
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
  resourceQuery: QueryState<T, undefined>;
  readOnlyLink?: string;
  disableLinkerTab?: boolean;
  nestedForm: ReactNode;
  linkerTabContent: ReactNode;
  briefDetails: (resource: PersistedResource<T>) => ReactNode;
}

/** Tabbed view for a nested form where you can either add/edit a resource or link an existing one. */
export function TabbedResourceLinker<T extends KitsuResource>({
  resourceId,
  setResourceId,
  readOnlyLink,
  resourceQuery,
  disableLinkerTab,
  nestedForm,
  linkerTabContent,
  briefDetails
}: TabbedResourceLinkerProps<T>) {
  const { isTemplate } = useDinaFormContext();

  return (
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
        <Tab disabled={disableLinkerTab}>
          <DinaMessage id="attachExisting" />
        </Tab>
      </TabList>
      <TabPanel>
        {
          // If there is already a linked resource then wait for it to load first:
          resourceId
            ? withResponse(resourceQuery, ({ data: linkedResource }) => (
                <>
                  <div className="mb-3 d-flex justify-content-end align-items-center">
                    <Link href={`${readOnlyLink}${linkedResource.id}`}>
                      <a target="_blank">
                        <DinaMessage id="detailsPageLink" />
                      </a>
                    </Link>
                    {
                      // Do not allow changing an attached resource from a template:
                      !disableLinkerTab && (
                        <FormikButton
                          className="btn btn-danger detach-resource-button ms-5"
                          onClick={() => setResourceId(null)}
                        >
                          <DinaMessage id="detach" />
                        </FormikButton>
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
                            <a target="_blank">{linkedResource.id}</a>
                          </Link>
                        </div>
                        {briefDetails(linkedResource as PersistedResource<T>)}
                      </div>
                    ) : (
                      // In form mode, show the actual editable resource form:
                      nestedForm
                    )
                  }
                </>
              ))
            : nestedForm
        }
      </TabPanel>
      <TabPanel>{linkerTabContent}</TabPanel>
    </Tabs>
  );
}
