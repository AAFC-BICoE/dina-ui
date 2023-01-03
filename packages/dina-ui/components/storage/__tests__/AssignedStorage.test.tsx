import { DinaForm } from "common-ui";
import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { StorageUnit } from "../../../types/collection-api";
import { AssignedStorage } from "../AssignedStorage";

const STORAGE_A_SHALLOW: PersistedResource<StorageUnit> = {
  id: "A",
  group: "group",
  name: "A",
  type: "storage-unit"
};

// A < B < C < D < E
const STORAGE_A: PersistedResource<StorageUnit> = {
  id: "A",
  group: "group",
  name: "A",
  type: "storage-unit",
  storageUnitType: {
    id: "Box",
    type: "storage-unit-type",
    name: "Box",
    group: "group"
  },
  parentStorageUnit: {
    id: "B",
    group: "group",
    name: "B",
    type: "storage-unit",
    hierarchy: [
      { uuid: "B", name: "B", typeName: "Shelf", typeUuid: "SHELF" },
      { uuid: "C", name: "C", typeName: "Cabinet", typeUuid: "CABINET" },
      { uuid: "D", name: "D", typeName: "Room", typeUuid: "ROOM" },
      { uuid: "E", name: "E", typeName: "Building", typeUuid: "BUILDING" }
    ]
  }
};

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/storage-unit/A":
      return { data: STORAGE_A };
  }
});

const mockBulkGet = jest.fn(async paths =>
  paths.map(path => {
    switch (path) {
      case "storage-unit/B?include=hierarchy":
        return {
          id: "B",
          group: "group",
          name: "B",
          type: "storage-unit",
          hierarchy: [
            { uuid: "B", name: "B", typeName: "Shelf", typeUuid: "SHELF" },
            { uuid: "C", name: "C", typeName: "Cabinet", typeUuid: "CABINET" },
            { uuid: "D", name: "D", typeName: "Room", typeUuid: "ROOM" },
            { uuid: "E", name: "E", typeName: "Building", typeUuid: "BUILDING" }
          ]
        };
    }
  })
);

const apiContext = {
  apiClient: {
    get: mockGet
  },
  bulkGet: mockBulkGet
};

const mockOnChange = jest.fn();

describe("AssignedStorage component", () => {
  beforeEach(jest.clearAllMocks);

  it("Renders the storage unit path", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <AssignedStorage onChange={mockOnChange} value={STORAGE_A_SHALLOW} />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper
        .find(".storage-path li.breadcrumb-item")
        .map((node) => node.text().trim())
    ).toEqual([
      "E (Building)",
      "D (Room)",
      "C (Cabinet)",
      "B (Shelf)",
      "A (Box)"
    ]);
  });

  it("Lets you remove the storage unit", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <AssignedStorage onChange={mockOnChange} value={STORAGE_A_SHALLOW} />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.remove-storage").simulate("click");
    expect(mockOnChange).lastCalledWith({ id: null });
  });
});
