import {
  BULK_ADD_FILES_KEY,
  BulkAddFileInfo
} from "../../../pages/object-store/upload";
import {
  ResourceHandler,
  SaveResourceContext,
  SaveResourceResult
} from "./types";

export const metadataHandler: ResourceHandler = {
  async processResource(
    context: SaveResourceContext
  ): Promise<SaveResourceResult> {
    const {
      resource,
      group,
      workbookColumnMap,
      linkRelationshipAttribute,
      agentId
    } = context;

    // Apply sourceSet field.
    resource.sourceSet = context.sourceSet;

    // Read uploaded files from local storage.
    const uploadedGroups: BulkAddFileInfo[] = JSON.parse(
      localStorage.getItem(BULK_ADD_FILES_KEY) ?? "[]"
    );

    // Find the entry for the current group.
    const groupEntry = uploadedGroups.find((entry) => entry.group === group);

    // Find the matching file within that group's files by originalFilename.
    const matchingFile = groupEntry?.files.find(
      (file) => file.originalFilename === resource.originalFilename
    );

    // If matchingFile is not found, throw an error.
    if (!matchingFile) {
      throw new Error(
        `No uploaded file found for metadata with original filename: ${resource.originalFilename} in group: ${group}`
      );
    }

    // Bucket must be set from group
    resource.bucket = group;

    // Set the acMetadataCreator
    resource.acMetadataCreator = agentId
      ? {
          id: agentId,
          type: "person"
        }
      : undefined;

    // Set the caption default if not provided
    if (!resource.acCaption) {
      resource.acCaption = matchingFile.originalFilename;
    }

    // AcSubtype should be uppercase if provided.
    if (resource.acSubtype) {
      resource.acSubtype = resource.acSubtype.toUpperCase();
    }

    // Set the file identifer from the upload
    resource.fileIdentifier = matchingFile.id;

    // Link relationships
    for (const key of Object.keys(resource)) {
      await linkRelationshipAttribute(resource, workbookColumnMap, key, group);
    }

    return { shouldPause: false };
  }
};
