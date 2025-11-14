import {
  BULK_ADD_FILES_KEY,
  BulkAddFileInfo
} from "../../../../pages/object-store/upload";
import { metadataHandler } from "../MetadataHandler";
import { SaveResourceContext } from "../types";

describe("metadataHandler", () => {
  let mockLinkRelationshipAttribute: jest.Mock;
  let baseContext: SaveResourceContext;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: jest.fn((key) => localStorageMock[key] || null),
      setItem: jest.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: jest.fn((key) => {
        delete localStorageMock[key];
      }),
      clear: jest.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: jest.fn()
    };

    mockLinkRelationshipAttribute = jest.fn();

    baseContext = {
      resource: {
        originalFilename: "test-image.jpg",
        type: "metadata"
      },
      group: "test-group",
      apiClient: {} as any,
      workbookColumnMap: {},
      appendData: false,
      linkRelationshipAttribute: mockLinkRelationshipAttribute,
      userSelectedSameNameExistingResource: { current: null },
      sameNameExistingResources: { current: [] },
      userSelectedSameNameParentSample: { current: null },
      sameNameParentSamples: { current: [] },
      resourcesUpdatedCount: { current: 0 },
      sourceSet: "test-source-set",
      agentId: "agent-123"
    };
  });

  it("should set bucket, fileIdentifier, and default acCaption when matching file found", async () => {
    const uploadedFiles: BulkAddFileInfo[] = [
      {
        id: "file-uuid-123",
        originalFilename: "test-image.jpg",
        uploadedFilename: "uploaded-test-image.jpg"
      } as BulkAddFileInfo
    ];

    localStorage.setItem(BULK_ADD_FILES_KEY, JSON.stringify(uploadedFiles));

    const result = await metadataHandler.processResource(baseContext);

    expect(baseContext.resource.bucket).toBe("test-group");
    expect(baseContext.resource.fileIdentifier).toBe("file-uuid-123");
    expect(baseContext.resource.acCaption).toBe("test-image.jpg");
    expect(result.shouldPause).toBe(false);
  });

  it("should not override existing acCaption", async () => {
    baseContext.resource.acCaption = "Custom caption provided by user";

    const uploadedFiles: BulkAddFileInfo[] = [
      {
        id: "file-uuid-123",
        originalFilename: "test-image.jpg",
        uploadedFilename: "uploaded-test-image.jpg"
      } as BulkAddFileInfo
    ];

    localStorage.setItem(BULK_ADD_FILES_KEY, JSON.stringify(uploadedFiles));

    await metadataHandler.processResource(baseContext);

    expect(baseContext.resource.acCaption).toBe(
      "Custom caption provided by user"
    );
  });

  it("should handle when no matching file found in localStorage", async () => {
    const uploadedFiles: BulkAddFileInfo[] = [
      {
        id: "different-file-uuid",
        originalFilename: "different-image.jpg",
        uploadedFilename: "uploaded-different-image.jpg"
      } as BulkAddFileInfo
    ];

    localStorage.setItem(BULK_ADD_FILES_KEY, JSON.stringify(uploadedFiles));

    await metadataHandler.processResource(baseContext);

    expect(baseContext.resource.bucket).toBe("test-group");
    expect(baseContext.resource.fileIdentifier).toBeUndefined();
    expect(baseContext.resource.acCaption).toBeUndefined();
  });

  it("should set acMetadataCreator from agentId and call linkRelationshipAttribute", async () => {
    baseContext.resource = {
      originalFilename: "test-image.jpg",
      type: "metadata",
      acTags: ["tag1", "tag2"]
    };

    await metadataHandler.processResource(baseContext);

    expect(baseContext.resource.acMetadataCreator).toEqual({
      id: "agent-123",
      type: "person"
    });

    expect(mockLinkRelationshipAttribute).toHaveBeenCalledTimes(5);
    expect(mockLinkRelationshipAttribute).toHaveBeenCalledWith(
      baseContext.resource,
      baseContext.workbookColumnMap,
      "originalFilename",
      "test-group"
    );
    expect(mockLinkRelationshipAttribute).toHaveBeenCalledWith(
      baseContext.resource,
      baseContext.workbookColumnMap,
      "acTags",
      "test-group"
    );
  });
});
