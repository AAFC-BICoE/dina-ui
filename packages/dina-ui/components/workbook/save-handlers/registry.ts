import { ResourceHandler } from "./types";
import { materialSampleHandler } from "./MaterialSampleHandler";
import { metadataHandler } from "./MetadataHandler";

/**
 * Registry of handlers for different resource types.
 */
export const typeHandlers: Record<string, ResourceHandler> = {
  "material-sample": materialSampleHandler,
  metadata: metadataHandler
};

/**
 * Get the handler for a specific resource type
 */
export function getHandlerForType(type: string): ResourceHandler {
  const handler = typeHandlers[type];
  if (!handler) {
    throw new Error(`No handler found for resource type: ${type}`);
  }
  return handler;
}
