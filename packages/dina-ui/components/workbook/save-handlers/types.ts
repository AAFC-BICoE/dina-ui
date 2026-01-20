// packages/dina-ui/components/workbook/save-handlers/types.ts

import Kitsu from "kitsu";
import { WorkbookColumnMap } from "../types/Workbook";

/**
 * Custom error class for workbook save errors that supports i18n.
 * The messageKey and messageValues are used by the UI component to format the error message.
 */
export class WorkbookSaveError extends Error {
  messageKey: string;
  messageValues: Record<string, any>;

  constructor(
    messageKey: string,
    messageValues: Record<string, any> = {},
    fallbackMessage?: string
  ) {
    super(fallbackMessage || messageKey);
    this.name = "WorkbookSaveError";
    this.messageKey = messageKey;
    this.messageValues = messageValues;
  }
}

export interface SaveResourceContext {
  resource: any;
  sourceSet: string;
  group: string;
  apiClient: Kitsu;
  workbookColumnMap: WorkbookColumnMap;
  appendData: boolean;
  linkRelationshipAttribute: (
    resource: any,
    workbookColumnMap: WorkbookColumnMap,
    key: string,
    group: string
  ) => Promise<void>;
  userSelectedSameNameExistingResource: React.MutableRefObject<any>;
  sameNameExistingResources: React.MutableRefObject<any[]>;
  userSelectedSameNameParentSample: React.MutableRefObject<any>;
  sameNameParentSamples: React.MutableRefObject<any[]>;
  resourcesUpdatedCount: React.MutableRefObject<number>;
  agentId?: string;
}

export interface SaveResourceResult {
  /**
   * Indicates whether the save process should pause for user input.
   */
  shouldPause: boolean;

  /**
   * Reason for pausing the save process.
   */
  pauseReason?: "duplicate-record" | "duplicate-parent";
}

/**
 * Handler interface - each resource type implements this
 *
 * A save handler is used to process and prepare a resource of a specific type before it is saved.
 * The handler can modify the resource, link relationships, and determine if user input is needed
 * to resolve issues like duplicates.
 */
export interface ResourceHandler {
  /**
   * Process and prepare a single resource for saving.
   * Returns shouldPause=true if user input is needed.
   */
  processResource(context: SaveResourceContext): Promise<SaveResourceResult>;
}
