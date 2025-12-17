interface ResourceTypeConfig {
  fields: string[];
}

export interface RelationshipFields {
  [apiName: string]: {
    [resourceType: string]: ResourceTypeConfig;
  };
}

type ResourceConfig = Record<string, (resource: any) => string | undefined>;

/**
 * Defines the mapping of API sources and their related object fields that reference person relationships.
 *
 * This object specifies, for each API (such as "objectstore-api" and "collection-api"),
 * the entities and their respective fields that are associated with person relationships.
 *
 * @remarks
 * This mapping is used to identify which fields in various APIs reference person entities,
 * facilitating relationship management and data linking in the application.
 *
 * @type {RelationshipFields}
 */
export const personRelationshipFields: RelationshipFields = {
  "objectstore-api": {
    metadata: {
      fields: ["dcCreator", "acMetadataCreator"]
    }
  },
  "collection-api": {
    "material-sample": {
      fields: ["preparedBy"]
    },
    "collecting-event": {
      fields: ["collectors"]
    },
    project: {
      fields: ["contributors.agent"]
    },
    expedition: {
      fields: ["participants"]
    }
  }
  // will be added later once seqdb-api is updated
  // "seqdb-api": {
  //   "pcr-batch": {
  //     fields: ["experimenters"]
  //   },
  //   "seq-batch": {
  //     fields: ["experimenters"]
  //   },
  //   "seq-submission": {
  //     fields: ["submittedBy"]
  //   }
  // }
};

/**
 * Returns the display name of a resource based on its type and object properties.
 *
 * @param resourceType - The type of the resource (e.g., "metadata", "material-sample").
 * @param resource - The resource object containing relevant properties.
 * @returns The resource's display name, its `id` if no name property is found, or "Unknown" if neither is available.
 */
export function getResourceName(resourceType: string, resource: any): string {
  const resourceNameConfig: ResourceConfig = {
    metadata: (r) => r.filename,
    "material-sample": (r) => r.materialSampleName,
    "collecting-event": (r) => r.dwcFieldNumber,
    project: (r) => r.name,
    expedition: (r) => r.name,
    "pcr-batch": (r) => r.name,
    "seq-batch": (r) => r.name,
    "seq-submission": (r) => r.name
  };

  return (
    resourceNameConfig[resourceType]?.(resource) ?? resource.id ?? "Unknown"
  );
}

/**
 * Returns the API name associated with a given resource type.
 *
 * @param resourceType - The type of resource for which to retrieve the API mapping.
 * @returns The API name as a string if the resource type exists in the mapping; otherwise, undefined.
 */
export function getResourceApi(resourceType: string): string | undefined {
  const apiMapping = {
    metadata: "object-store",
    "material-sample": "collection",
    "collecting-event": "collection",
    project: "collection",
    expedition: "collection",
    "pcr-batch": "seqdb",
    "seq-batch": "seqdb",
    "seq-submission": "seqdb"
  };
  return apiMapping[resourceType];
}
