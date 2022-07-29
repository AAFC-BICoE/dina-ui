import { useApiClient, useQuery } from "common-ui";
import {
  License,
  Metadata,
  ObjectUpload
} from "../../../types/objectstore-api";

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
