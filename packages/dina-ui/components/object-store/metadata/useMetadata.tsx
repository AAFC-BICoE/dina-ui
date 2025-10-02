import {
  isResourceEmpty,
  resourceDifference,
  SaveArgs,
  useApiClient,
  useQuery
} from "common-ui";
import { InputResource } from "kitsu";
import {
  License,
  Metadata,
  ObjectUpload,
  Derivative
} from "../../../types/objectstore-api";
import _ from "lodash";

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
  const { bulkGet } = useApiClient();
  const query = useQuery<Metadata & { objectUpload: ObjectUpload }>(
    {
      include: "acMetadataCreator,dcCreator,derivatives",
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
      onSuccess: async (response) => {
        // fetch the uploadObject for each derivative and add it to the derivative object.
        if (!response.data.derivatives) return; // If no derivatives, return early.
        const derivativeIdentifiers =
          response.data?.derivatives?.map(
            (derivative) => `object-upload/${derivative.fileIdentifier}`
          ) ?? [];

        const objectUploadResponse = (
          await bulkGet(derivativeIdentifiers, {
            apiBaseUrl: "/objectstore-api",
            returnNullForMissingResource: true
          })
        ).filter((item) => item !== null);
        const changesMap = new Map(
          objectUploadResponse.map((change) => [change.id, change])
        );

        response.data.derivatives = response.data.derivatives.map(
          (derivative) => ({
            ...derivative,
            objectUpload: changesMap.get(derivative.fileIdentifier)
          })
        );
      }
    }
  );
  return query;
}

export function useDerivativeMetadataViewQuery(id?: string) {
  const query = useQuery<
    Derivative & { derivedFrom: Metadata } & { objectUpload: ObjectUpload }
  >(
    {
      include: "acDerivedFrom,generatedFromDerivative",
      path: `objectstore-api/derivative/${id}`,
      header: { "include-dina-permission": "true" }
    },
    {
      joinSpecs: [
        {
          apiBaseUrl: "/objectstore-api",
          idField: "fileIdentifier",
          joinField: "objectUpload",
          path: (derivative) => `object-upload/${derivative.fileIdentifier}`
        }
      ]
    }
  );
  return query;
}

export function useDerivativeEditQuery(id?: string | null) {
  const derivativeQuery = useQuery<Derivative>(
    {
      path: `objectstore-api/derivative/${id}`,
      include: "acDerivedFrom,generatedFromDerivative"
    },
    {
      disabled: !id,
      joinSpecs: [
        {
          apiBaseUrl: "/objectstore-api",
          idField: "fileIdentifier",
          joinField: "objectUpload",
          path: (derivative) => `object-upload/${derivative.fileIdentifier}`
        }
      ]
    }
  );
  return derivativeQuery;
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
  const { save } = useApiClient();
  const {
    // Don't include derivatives in the form submission:
    derivatives: _initialDerivatives,
    license: _initialLicense,
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

    // Before checking the difference, we need to parse some fields.
    preprocessed.acSubtype =
      (preprocessed as any)?.acSubtype?.acSubtype ?? undefined;
    preprocessed.xmpRightsWebStatement =
      (preprocessed as any)?.license?.url ?? "";
    delete preprocessed.license;

    // Only submit the changed values to the back-end:
    const metadataDiff: InputResource<Metadata> = initialMetadataValues.id
      ? resourceDifference({
          original: initialMetadataValues,
          updated: preprocessed
        })
      : preprocessed;

    const metadataWithRelationships: InputResource<Metadata> & {
      relationships: any;
    } = {
      ...metadataDiff,
      relationships: {
        ...(metadataDiff.dcCreator && {
          dcCreator: {
            data: metadataDiff.dcCreator?.id
              ? _.pick(metadataDiff.dcCreator, "id", "type")
              : null
          }
        }),
        ...(metadataDiff.acMetadataCreator && {
          acMetadataCreator: {
            data: metadataDiff.acMetadataCreator?.id
              ? _.pick(metadataDiff.acMetadataCreator, "id", "type")
              : null
          }
        })
      }
    };

    // Delete relationships handled above.
    delete metadataWithRelationships.acMetadataCreator;
    delete metadataWithRelationships.dcCreator;

    // If the relationship section is empty, remove it from the query.
    if (Object.keys(metadataWithRelationships.relationships).length === 0) {
      delete metadataWithRelationships.relationships;
    }

    const saveOperation = {
      resource: metadataWithRelationships,
      type: "metadata"
    };
    return saveOperation;
  }

  async function onSubmit({ submittedValues }) {
    const { derivatives: _derivatives, ...metadataValues } = submittedValues;

    const saveOperation = await prepareMetadataSaveOperation({
      submittedValues: metadataValues
    });

    // Remove blank managed attribute values from the map:
    const blankValues: any[] = ["", null];
    for (const maKey of _.keys(saveOperation?.resource.managedAttributes)) {
      if (
        blankValues.includes(saveOperation?.resource.managedAttributes?.[maKey])
      ) {
        delete saveOperation?.resource.managedAttributes?.[maKey];
      }
    }

    // Do not perform an empty save request.
    if (
      isResourceEmpty(saveOperation?.resource) &&
      saveOperation?.resource?.id
    ) {
      await onSaved?.(saveOperation.resource.id);
    } else {
      const savedMetadata = await save<Metadata>([saveOperation], {
        apiBaseUrl: "/objectstore-api"
      });

      await onSaved?.(savedMetadata[0].id);
    }
  }

  return {
    onSubmit,
    prepareMetadataSaveOperation,
    initialValues: metadataInitialValues
  };
}

export interface UseDerivativeSaveParams {
  /** Derivative form initial values. */
  initialValues?: any;

  // Redirect to next page
  onSaved?: (id: string) => Promise<void>;
}

export interface PrepareDerivativeSaveOperationParams {
  submittedValues: any;
  preProcessMetadata?: (
    sample: InputResource<Metadata>
  ) => Promise<InputResource<Metadata>>;
}

export function useDerivativeSave({
  initialValues,
  onSaved
}: UseDerivativeSaveParams) {
  const { save } = useApiClient();
  const { ...initialDerivativeValues } = initialValues;

  const defaultValues: InputResource<Metadata> = {
    type: "metadata",
    group: ""
  };

  const derivativeInitialValues: InputResource<Metadata> = initialValues
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
  async function prepareDerivativeSaveOperation({
    submittedValues,
    preProcessMetadata
  }: PrepareDerivativeSaveOperationParams): Promise<SaveArgs<Derivative>> {
    const preprocessed =
      (await preProcessMetadata?.(submittedValues)) ?? submittedValues;

    // Only submit the changed values to the back-end:
    const diff = initialDerivativeValues.id
      ? resourceDifference({
          original: initialDerivativeValues,
          updated: preprocessed
        })
      : preprocessed;

    const saveOperation = {
      resource: diff,
      type: "derivative"
    };
    return saveOperation;
  }

  async function onSubmit({ submittedValues }) {
    const { ...derivativeValues } = submittedValues;

    const saveOperation = await prepareDerivativeSaveOperation({
      submittedValues: derivativeValues
    });

    const savedDerivative = await save<Derivative>([saveOperation], {
      apiBaseUrl: "/objectstore-api"
    });

    await onSaved?.(savedDerivative[0].id);
  }

  return {
    onSubmit,
    prepareDerivativeSaveOperation,
    initialValues: derivativeInitialValues
  };
}
