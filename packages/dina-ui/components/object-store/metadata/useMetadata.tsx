import {
  DinaFormSubmitParams,
  resourceDifference,
  SaveArgs,
  useApiClient,
  useQuery
} from "common-ui";
import { InputResource } from "kitsu";
import {
  License,
  Metadata,
  ObjectUpload
} from "../../../types/objectstore-api";
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
  initialValues?: any;
}

export interface PrepareMetadataSaveOperationParams {
  submittedValues: any;
  preProcessMetadata?: (
    sample: InputResource<Metadata>
  ) => Promise<InputResource<Metadata>>;
}

export function useMetadataSave(initialValues) {
  const { apiClient, save } = useApiClient();
  const {
    // Don't include derivatives in the form submission:
    derivatives: initialDerivatives,
    license: initialLicense,
    acSubtype: initialAcSubtype,
    ...initialMetadataValues
  } = initialValues;

  /**
   * Gets the diff of the form's initial values to the new sample state,
   * so only edited values are submitted to the back-end.
   */
  async function prepareMetadataSaveOperation({
    submittedValues,
    preProcessMetadata
  }: PrepareMetadataSaveOperationParams): Promise<SaveArgs<Metadata>> {
    const preprocessed =
      (await preProcessMetadata?.(submittedValues)) ?? submittedValues;

    // Only submit the changed values to the back-end:
    const diff = initialMetadataValues.id
      ? resourceDifference({
          original: initialMetadataValues,
          updated: preprocessed
        })
      : preprocessed;

    const saveOperation = {
      resource: diff,
      type: "metadata"
    };
    return saveOperation;
  }

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

    const saveOperation = await prepareMetadataSaveOperation({
      submittedValues: metadataValues
    });
    saveOperation.resource.acSubtype = acSubtype?.acSubtype ?? null;

    // Remove blank managed attribute values from the map:
    const blankValues: any[] = ["", null];
    for (const maKey of keys(saveOperation?.resource.managedAttributes)) {
      if (
        blankValues.includes(saveOperation?.resource.managedAttributes?.[maKey])
      ) {
        delete saveOperation?.resource.managedAttributes?.[maKey];
      }
    }

    await save([saveOperation], { apiBaseUrl: "/objectstore-api" });
  }

  return {
    onSubmit,
    prepareMetadataSaveOperation
  };
}
