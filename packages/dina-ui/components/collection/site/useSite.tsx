import { FormikContextType } from "formik";
import { PersistedResource } from "kitsu";
import _ from "lodash";
import {
  isResourceEmpty,
  resourceDifference,
  useApiClient,
  useQuery
} from "common-ui";
import { Site } from "packages/dina-ui/types/collection-api";
import { AllowAttachmentsConfig } from "packages/dina-ui/components/object-store";

export function useSiteQuery(id?: string | null) {
  const siteQuery = useQuery<Site>(
    {
      path: `collection-api/site/${id}?include=attachment`,
      header: { "include-dina-permission": "true" }
    },
    {
      // Return undefined when ID is undefined:
      disabled: !id,
      onSuccess: async ({ data }) => {
        data.attachment = _.uniqBy(data.attachment, "id");
      }
    }
  );

  return siteQuery;
}

/** Site save method */
export function useSiteSave({
  fetchedSite,
  attachmentsConfig
}: {
  fetchedSite?: PersistedResource<Site>;
  attachmentsConfig?: AllowAttachmentsConfig;
}) {
  const { save } = useApiClient();
  const siteInitialValues: Partial<Site> = fetchedSite
    ? {
        ...fetchedSite,
        multilingualDescription: fetchedSite.multilingualDescription
          ?.descriptions
          ? _.fromPairs(
              fetchedSite.multilingualDescription.descriptions.map(
                ({ lang, desc }) => [lang, desc]
              )
            )
          : {}
      }
    : {};

  async function saveSite(
    submittedValues: Site,
    siteFormik: FormikContextType<any>
  ) {
    // Only submit the changed values to the back-end:
    const siteDiff = siteInitialValues.id
      ? resourceDifference({
          original: siteInitialValues as Site,
          updated: submittedValues
        })
      : submittedValues;

    // Init relationships object for one-to-many relations
    (siteDiff as any).relationships = {};

    // Add attachments if they were selected:
    if (siteDiff?.attachment) {
      (siteDiff as any).relationships.attachment = {
        data:
          siteDiff.attachment?.map((it) => ({
            id: it.id,
            type: it.type
          })) ?? []
      };

      // Delete the 'attachment' attribute because it should stay in the relationships field:
      delete siteDiff.attachment;
    }

    // If multilingualDescription is provided, transform it to the correct edit format:
    if (siteDiff?.multilingualDescription) {
      const transformedDescription = {
        descriptions: _.toPairs(siteDiff.multilingualDescription).map(
          ([lang, desc]) => ({ lang, desc })
        )
      };

      // Use the transformed description.
      siteDiff.multilingualDescription = transformedDescription;
    }

    // If the relationship section is empty, remove it from the query.
    if (Object.keys((siteDiff as any).relationships).length === 0) {
      delete (siteDiff as any).relationships;
    }

    // Do not perform any request if it's empty...
    if (isResourceEmpty(siteDiff)) {
      siteFormik.setFieldValue("id", siteDiff.id);
      return siteDiff as PersistedResource<Site>;
    }

    // Check if the user has permission to edit the site itself. It can be attached
    // to the material sample still.
    const permissionsProvided = submittedValues?.meta?.permissionsProvider;
    const canEdit = permissionsProvided
      ? submittedValues?.meta?.permissions?.includes(
          siteInitialValues.id ? "update" : "create"
        ) ?? false
      : true;
    if (!canEdit) {
      siteFormik.setFieldValue("id", siteDiff.id);
      return siteDiff as PersistedResource<Site>;
    }

    const [savedSite] = await save<Site>(
      [
        {
          resource: siteDiff,
          type: "site"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );

    // Set the Site ID so if there is an error after this,
    // then subsequent submissions use PATCH instea of POST:
    siteFormik.setFieldValue("id", savedSite.id);

    return savedSite;
  }

  return {
    siteInitialValues,
    saveSite,
    attachmentsConfig
  };
}
