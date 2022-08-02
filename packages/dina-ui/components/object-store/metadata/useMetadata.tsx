import { DinaFormSubmitParams, useApiClient, useQuery } from "common-ui";
import { InputResource } from "kitsu";
import {
  License,
  Metadata,
  ObjectUpload
} from "../../../types/objectstore-api";
import { NextRouter } from "next/router";
import { keys } from "lodash";

export function useMetadataEditQuery(id?: string | null) {
  const { apiClient } = useApiClient();

  const metadataQuery = useQuery<Metadata>(
    {
      path: `objectstore-api/metadata/${id}`,
      include: "dcCreator,derivatives"
    },
    {
      joinSpecs: [
        // Join to persons api:
        {
          apiBaseUrl: "/agent-api",
          idField: "dcCreator",
          joinField: "dcCreator",
          path: metadata => `person/${metadata.dcCreator.id}`
        }
      ],
      onSuccess: async ({ data: metadata }) => {
        // Get the License resource based on the Metadata's xmpRightsWebStatement field:
        if (metadata.xmpRightsWebStatement) {
          const url = metadata.xmpRightsWebStatement;
          (metadata as any).license = (
            await apiClient.get<License[]>("objectstore-api/license", {
              filter: { url }
            })
          ).data[0];
        }
      }
    }
  );
  return metadataQuery;
}

export function useMetadataViewQuery(id?: string) {
  const query = useQuery<Metadata & { objectUpload: ObjectUpload }>(
    {
      include: "managedAttributeMap,acMetadataCreator,dcCreator,derivatives",
      path: `objectstore-api/metadata/${id}`
    },
    {
      joinSpecs: [
        {
          apiBaseUrl: "/agent-api",
          idField: "acMetadataCreator",
          joinField: "acMetadataCreator",
          path: metadata => `person/${metadata.acMetadataCreator.id}`
        },
        {
          apiBaseUrl: "/agent-api",
          idField: "dcCreator",
          joinField: "dcCreator",
          path: metadata => `person/${metadata.dcCreator.id}`
        },
        {
          apiBaseUrl: "/objectstore-api",
          idField: "fileIdentifier",
          joinField: "objectUpload",
          path: metadata => `object-upload/${metadata.fileIdentifier}`
        }
      ]
    }
  );

  return query;
}

export interface UseMetadataSaveParams {
  /** Metadata form initial values. */
  metadata?: InputResource<Metadata>;
  router?: NextRouter;
}

export function useMetadataSave({ metadata, router }: UseMetadataSaveParams) {
  const { apiClient, save } = useApiClient();

  async function onSubmit({ submittedValues }) {
    const {
      // Don't include derivatives in the form submission:
      derivatives,
      license,
      acSubtype,
      ...metadataValues
    } = submittedValues;

    if (license) {
      const selectedLicense = license?.id
        ? (
            await apiClient.get<License>(
              `objectstore-api/license/${license.id}`,
              {}
            )
          ).data
        : null;
      // The Metadata's xmpRightsWebStatement field stores the license's url.
      metadataValues.xmpRightsWebStatement = selectedLicense?.url ?? "";
      // No need to store this ; The url should be enough.
      metadataValues.xmpRightsUsageTerms = "";
    }

    const metadataEdit = {
      ...metadataValues,
      // Convert the object back to a string:
      acSubtype: acSubtype?.acSubtype ?? null
    };

    // Remove blank managed attribute values from the map:
    const blankValues: any[] = ["", null];
    for (const maKey of keys(metadataEdit?.managedAttributes)) {
      if (blankValues.includes(metadataEdit?.managedAttributes?.[maKey])) {
        delete metadataEdit?.managedAttributes?.[maKey];
      }
    }

    await save(
      [
        {
          resource: metadataEdit,
          type: "metadata"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );

    await router?.push(`/object-store/object/view?id=${router?.query}`);
  }
}
