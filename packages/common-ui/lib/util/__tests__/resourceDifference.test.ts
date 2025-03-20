import { resourceDifference } from "../resourceDifference";

function createMaterialSample(overrides: Partial<any> = {}): any {
  const defaultSample: any = {
    id: "1",
    type: "material-sample",
    materialSampleName: "MS1",
    collection: { id: "1", type: "collection" },
    organismsQuantity: undefined,
    organismsIndividualEntry: undefined,
    barcode: "original-barcode",
    restrictionFieldsExtension: null,
    preparationType: { id: null, type: "preparation-type" },
    preparationDate: null,
    preparedBy: [],
    preparationRemarks: null,
    dwcDegreeOfEstablishment: null,
    preparationMethod: { id: null, type: "preparation-method" },
    preservationType: null,
    preparationFixative: null,
    preparationMaterials: null,
    preparationSubstrate: null,
    preparationProtocol: { id: null, type: "protocol" },
    preparationManagedAttributes: {},
    isRestricted: false,
    restrictionRemarks: null,
    organism: [],
    storageUnitUsage: { id: null, type: "storage-unit-usage" },
    collectingEvent: { id: null, type: "collecting-event" },
    associations: [],
    hostOrganism: null
  };
  return { ...defaultSample, ...overrides };
}

describe("resourceDifference", () => {
  it("should return id and type only if no changes made", () => {
    const original = createMaterialSample();
    const updated = createMaterialSample();
    const diff = resourceDifference({ updated, original });
    expect(diff).toEqual({
      type: "material-sample",
      id: "1"
    });
  });

  it("should detect a changed string field", () => {
    const original = createMaterialSample({ materialSampleName: "MS1" });
    const updated = createMaterialSample({ materialSampleName: "MS2" });
    const diff = resourceDifference({ updated, original });
    expect(diff).toEqual({
      materialSampleName: "MS2",
      type: "material-sample",
      id: "1"
    });
  });

  it("should detect a changed number field", () => {
    const original = createMaterialSample({ organismsQuantity: 10 });
    const updated = createMaterialSample({ organismsQuantity: 20 });
    const diff = resourceDifference({ updated, original });
    expect(diff).toEqual({
      organismsQuantity: 20,
      type: "material-sample",
      id: "1"
    });
  });

  it("should detect a changed boolean field", () => {
    const original = createMaterialSample({ isRestricted: false });
    const updated = createMaterialSample({ isRestricted: true });
    const diff = resourceDifference({ updated, original });
    expect(diff).toEqual({
      isRestricted: true,
      type: "material-sample",
      id: "1"
    });
  });

  it("should detect a changed relationship (id)", () => {
    const original = createMaterialSample({
      collection: { id: "1", type: "collection" }
    });
    const updated = createMaterialSample({
      collection: { id: "2", type: "collection" }
    });
    const diff = resourceDifference({ updated, original });
    expect(diff).toEqual({
      collection: { id: "2", type: "collection" },
      type: "material-sample",
      id: "1"
    });
  });

  it("should detect a changed relationship (id to null)", () => {
    const original = createMaterialSample({
      collection: { id: "1", type: "collection" }
    });
    const updated = createMaterialSample({
      collection: { id: null, type: "collection" }
    });
    const diff = resourceDifference({ updated, original });
    expect(diff).toEqual({
      collection: { id: null, type: "collection" },
      type: "material-sample",
      id: "1"
    });
  });

  it("should handle null IDs correctly", () => {
    const original = createMaterialSample({
      preparationType: { id: null, type: "preparation-type" }
    });
    const updated = createMaterialSample({
      preparationType: { id: "1", type: "preparation-type" }
    });
    const diff = resourceDifference({ updated, original });
    expect(diff).toEqual({
      preparationType: { id: "1", type: "preparation-type" },
      type: "material-sample",
      id: "1"
    });
  });

  it("should detect a changed array field", () => {
    const original = createMaterialSample({ preparedBy: [] });
    const updated = createMaterialSample({ preparedBy: ["Person A"] });
    const diff = resourceDifference({ updated, original });
    expect(diff).toEqual({
      preparedBy: ["Person A"],
      type: "material-sample",
      id: "1"
    });
  });

  it("should detect a changed array field to empty array", () => {
    const original = createMaterialSample({ preparedBy: ["Person A"] });
    const updated = createMaterialSample({ preparedBy: [] });
    const diff = resourceDifference({ updated, original });
    expect(diff).toEqual({
      preparedBy: [],
      type: "material-sample",
      id: "1"
    });
  });

  it("should detect a changed managed attribute field", () => {
    const original = createMaterialSample({ preparationManagedAttributes: {} });
    const updated = createMaterialSample({
      preparationManagedAttributes: { key1: "value1" }
    });
    const diff = resourceDifference({ updated, original });
    expect(diff).toEqual({
      preparationManagedAttributes: { key1: "value1" },
      type: "material-sample",
      id: "1"
    });
  });

  // Example from the provided code
  it("should handle the example case", () => {
    const original = createMaterialSample({
      barcode: "original-barcode-1"
    });

    const updated = createMaterialSample({
      barcode: "edited-barcode-1"
    });

    const diff = resourceDifference({ updated, original });
    expect(diff).toEqual({
      barcode: "edited-barcode-1",
      type: "material-sample",
      id: "1"
    });
  });
});
