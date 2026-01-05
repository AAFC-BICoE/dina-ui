/**
 * Defines the structure for mapping API sources and their related object fields.
 */
export interface RelationshipFields {
  /**
   * API name (e.g. "objectstore-api", "collection-api", "seqdb-api").
   */
  [apiName: string]: {
    /**
     * Resource type (e.g. "metadata", "material-sample", "pcr-batch").
     */
    [resourceType: string]: {
      /**
       * Fields in the resource that reference the related object.
       */
      fields: string[];

      /**
       * Used to display the user-friendly name of the related object.
       *
       * @param resource The related resource object.
       * @returns A string representing the name of the resource, or undefined if not provided.
       */
      nameMapping: (resource: any) => string | undefined;

      /**
       * Link to the resource view page, id will be appended at the end.
       *
       * e.g. "/object-store/object/view?id="
       */
      linkPath: string;
    };
  };
}

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
      fields: ["dcCreator.id", "acMetadataCreator.id"],
      nameMapping: (resource: any) => resource.filename,
      linkPath: "/object-store/object/view?id="
    }
  },
  "collection-api": {
    "material-sample": {
      fields: ["preparedBy.id"],
      nameMapping: (resource: any) => resource.materialSampleName,
      linkPath: "/collection/material-sample/view?id="
    },
    "collecting-event": {
      fields: ["collectors.id"],
      nameMapping: (resource: any) => resource.dwcFieldNumber,
      linkPath: "/collection/collecting-event/view?id="
    },
    project: {
      fields: ["contributors.agent"],
      nameMapping: (resource: any) => resource.name,
      linkPath: "/collection/project/view?id="
    },
    expedition: {
      fields: ["participants.id"],
      nameMapping: (resource: any) => resource.name,
      linkPath: "/collection/expedition/view?id="
    }
  }
  // will be added later once seqdb-api is updated
  // "seqdb-api": {
  //   "pcr-batch": {
  //     fields: ["experimenters"],
  //     nameMapping: (resource: any) => resource.name,
  //     linkPath: "/seqdb/pcr-batch/view?id="
  //   },
  //   "seq-batch": {
  //     fields: ["experimenters"],
  //     nameMapping: (resource: any) => resource.name,
  //     linkPath: "/seqdb/seq-batch/view?id="
  //   },
  //   "seq-submission": {
  //     fields: ["submittedBy"],
  //     nameMapping: (resource: any) => resource.name,
  //     linkPath: "/seqdb/seq-submission/view?id="
  //   }
  // }
};
