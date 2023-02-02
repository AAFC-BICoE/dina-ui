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
      disabled: !id,
      joinSpecs: [
        // Join to persons api:
        {
          apiBaseUrl: "/agent-api",
          idField: "dcCreator",
          joinField: "dcCreator",
          path: (metadata) => `person/${metadata.dcCreator.id}`
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
      path: `objectstore-api/metadata/${id}`,
      header: { "include-dina-permission": "true" }
    },
    {
      joinSpecs: [
        {
          apiBaseUrl: "/agent-api",
          idField: "acMetadataCreator",
          joinField: "acMetadataCreator",
          path: (metadata) => `person/${metadata.acMetadataCreator.id}`
        },
        {
          apiBaseUrl: "/agent-api",
          idField: "dcCreator",
          joinField: "dcCreator",
          path: (metadata) => `person/${metadata.dcCreator.id}`
        },
        {
          apiBaseUrl: "/objectstore-api",
          idField: "fileIdentifier",
          joinField: "objectUpload",
          path: (metadata) => `object-upload/${metadata.fileIdentifier}`
        }
      ],
      disabled: !id
    }
  );

  return query;
}

export interface UseMetadataSaveParams {
  /** Metadata form initial values. */
  initialValues?: any;

  // Redirect to next page
  onSaved?: (id: string) => Promise<void>;
}

export interface PrepareMetadataSaveOperationParams {
  submittedValues: any;
  preProcessMetadata?: (
    sample: InputResource<Metadata>
  ) => Promise<InputResource<Metadata>>;
}

export function useMetadataSave({
  initialValues,
  onSaved
}: UseMetadataSaveParams) {
  const { apiClient, save } = useApiClient();
  const {
    // Don't include derivatives in the form submission:
    derivatives: initialDerivatives,
    license: initialLicense,
    acSubtype: initialAcSubtype,
    ...initialMetadataValues
  } = initialValues;

  const defaultValues: InputResource<Metadata> = {
    type: "metadata",
    group: ""
  };

  const metadataInitialValues: InputResource<Metadata> = initialValues
    ? {
        ...initialValues,
        // Convert the string to an object for the dropdown:
        acSubtype: initialValues?.acSubtype
          ? {
              id: "id-unavailable",
              type: "object-subtype",
              acSubtype: initialValues.acSubtype
            }
          : undefined
      }
    : defaultValues;

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
      // The Metadata's xmpRightsWebStatement field stores the license's url.
      metadataValues.xmpRightsWebStatement = license?.url ?? "";
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

    const savedMetadata = await save<Metadata>([saveOperation], {
      apiBaseUrl: "/objectstore-api"
    });

    await onSaved?.(savedMetadata[0].id);
  }

  return {
    onSubmit,
    prepareMetadataSaveOperation,
    initialValues: metadataInitialValues
  };
}
