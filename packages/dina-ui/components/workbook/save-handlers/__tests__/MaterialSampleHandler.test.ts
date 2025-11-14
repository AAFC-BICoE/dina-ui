import { MaterialSample } from "../../../../types/collection-api";
import { materialSampleHandler } from "../MaterialSampleHandler";
import { SaveResourceContext } from "../types";
import { WorkbookColumnMap } from "../../types/Workbook";

describe("materialSampleHandler", () => {
  let mockApiClient: any;
  let mockLinkRelationshipAttribute: jest.Mock;
  let baseContext: SaveResourceContext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockApiClient = { get: jest.fn() };
    mockLinkRelationshipAttribute = jest.fn();

    baseContext = {
      resource: {
        materialSampleName: "TEST-SAMPLE-001",
        type: "material-sample"
      } as MaterialSample,
      group: "test-group",
      apiClient: mockApiClient,
      workbookColumnMap: {},
      appendData: false,
      linkRelationshipAttribute: mockLinkRelationshipAttribute,
      userSelectedSameNameExistingResource: { current: null },
      sameNameExistingResources: { current: [] },
      userSelectedSameNameParentSample: { current: null },
      sameNameParentSamples: { current: [] },
      resourcesUpdatedCount: { current: 0 },
      sourceSet: "test-source-set"
    };
  });

  it("should set sourceSet on the resource", async () => {
    const result = await materialSampleHandler.processResource(baseContext);

    expect(baseContext.resource.sourceSet).toBe("test-source-set");
    expect(result.shouldPause).toBe(false);
  });

  it("should create new resource when appendData is true and no existing resource found", async () => {
    baseContext.appendData = true;
    mockApiClient.get.mockResolvedValue({ data: [] });

    const result = await materialSampleHandler.processResource(baseContext);

    expect(baseContext.resource.id).toBeUndefined();
    expect(result.shouldPause).toBe(false);
    expect(baseContext.resourcesUpdatedCount.current).toBe(0);
  });

  it("should update existing resource when one match found", async () => {
    const existingResource = {
      id: "existing-123",
      materialSampleName: "TEST-SAMPLE-001",
      type: "material-sample"
    };

    baseContext.appendData = true;
    mockApiClient.get.mockResolvedValue({ data: [existingResource] });

    const result = await materialSampleHandler.processResource(baseContext);

    expect(baseContext.resource.id).toBe("existing-123");
    expect(baseContext.resourcesUpdatedCount.current).toBe(1);
    expect(result.shouldPause).toBe(false);
  });

  it("should pause when multiple existing resources found", async () => {
    const existingResources = [
      {
        id: "existing-1",
        materialSampleName: "TEST-SAMPLE-001",
        type: "material-sample"
      },
      {
        id: "existing-2",
        materialSampleName: "TEST-SAMPLE-001",
        type: "material-sample"
      }
    ];

    baseContext.appendData = true;
    mockApiClient.get.mockResolvedValue({ data: existingResources });

    const result = await materialSampleHandler.processResource(baseContext);

    expect(baseContext.sameNameExistingResources.current).toEqual(
      existingResources
    );
    expect(result.shouldPause).toBe(true);
  });

  it("should use user-selected existing resource without making API call", async () => {
    const selectedResource = {
      id: "selected-123",
      materialSampleName: "TEST-SAMPLE-001",
      type: "material-sample"
    };

    baseContext.appendData = true;
    baseContext.userSelectedSameNameExistingResource.current = selectedResource;

    await materialSampleHandler.processResource(baseContext);

    expect(mockApiClient.get).not.toHaveBeenCalled();
    expect(baseContext.resource.id).toBe("selected-123");
    expect(baseContext.resourcesUpdatedCount.current).toBe(1);
  });

  it("should pause when multiple parent samples with same name found", async () => {
    baseContext.resource.parentMaterialSample = {
      materialSampleName: "PARENT-SAMPLE-001"
    };

    const workbookColumnMap: WorkbookColumnMap = {
      "Parent Sample": {
        fieldPath: "parentMaterialSample.materialSampleName",
        originalColumnName: "Parent Sample",
        showOnUI: true,
        mapRelationship: true,
        numOfUniqueValues: 2,
        valueMapping: {},
        multipleValueMappings: {
          "PARENT-SAMPLE-001": [
            { id: "parent-1", type: "material-sample" },
            { id: "parent-2", type: "material-sample" }
          ]
        }
      }
    };

    baseContext.workbookColumnMap = workbookColumnMap;

    const result = await materialSampleHandler.processResource(baseContext);

    expect(result.shouldPause).toBe(true);
    expect(baseContext.sameNameParentSamples.current).toHaveLength(2);
    expect(baseContext.sameNameParentSamples.current[0]).toMatchObject({
      id: "parent-1",
      type: "material-sample",
      materialSampleName: "PARENT-SAMPLE-001"
    });
  });

  it("should update valueMapping when user has selected parent sample", async () => {
    const selectedParent = {
      id: "selected-parent-123",
      type: "material-sample",
      materialSampleName: "PARENT-SAMPLE-001"
    };

    baseContext.resource.parentMaterialSample = {
      materialSampleName: "PARENT-SAMPLE-001"
    };
    baseContext.userSelectedSameNameParentSample.current = selectedParent;

    const workbookColumnMap: WorkbookColumnMap = {
      "Parent Sample": {
        fieldPath: "parentMaterialSample.materialSampleName",
        originalColumnName: "Parent Sample",
        showOnUI: true,
        mapRelationship: true,
        numOfUniqueValues: 1,
        valueMapping: {}
      }
    };

    baseContext.workbookColumnMap = workbookColumnMap;

    await materialSampleHandler.processResource(baseContext);

    expect(
      workbookColumnMap["Parent Sample"].valueMapping["PARENT-SAMPLE-001"]
    ).toEqual({
      id: "selected-parent-123",
      type: "material-sample"
    });
  });

  it("should append array field data from existing resource", async () => {
    const existingResource = {
      id: "existing-123",
      materialSampleName: "TEST-SAMPLE-001",
      associations: [{ id: "assoc-1", type: "association" }],
      type: "material-sample"
    };

    baseContext.appendData = true;
    baseContext.resource.associations = [
      { id: "assoc-2", type: "association" }
    ];
    mockApiClient.get.mockResolvedValue({ data: [existingResource] });

    await materialSampleHandler.processResource(baseContext);

    // It should only be adding relationships, not overwriting them.
    expect(baseContext.resource.associations).toEqual([
      { id: "assoc-2", type: "association" },
      { id: "assoc-1", type: "association" }
    ]);
  });

  it("should append data to relationship fields", async () => {
    const existingResource = {
      id: "existing-123",
      associations: [{ id: "assoc-1", type: "association" }],
      type: "material-sample"
    };

    baseContext.appendData = true;
    baseContext.resource.relationships = {
      associations: {
        data: [{ id: "assoc-2", type: "association" }]
      }
    };
    mockApiClient.get.mockResolvedValue({ data: [existingResource] });

    await materialSampleHandler.processResource(baseContext);

    expect(baseContext.resource.relationships.associations.data).toEqual([
      { id: "assoc-2", type: "association" },
      { id: "assoc-1", type: "association" }
    ]);
  });

  it("should call linkRelationshipAttribute for each key in resource", async () => {
    baseContext.resource = {
      materialSampleName: "TEST-SAMPLE-001",
      type: "material-sample",
      preparationMethod: { id: "1", type: "preparation-method" }
    };

    await materialSampleHandler.processResource(baseContext);

    expect(mockLinkRelationshipAttribute).toHaveBeenCalledTimes(4);
    expect(mockLinkRelationshipAttribute).toHaveBeenCalledWith(
      baseContext.resource,
      baseContext.workbookColumnMap,
      "materialSampleName",
      "test-group"
    );
  });
});
