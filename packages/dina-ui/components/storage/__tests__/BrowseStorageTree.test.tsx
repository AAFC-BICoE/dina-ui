import { PersistedResource } from "kitsu";
import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { StorageUnit } from "../../../types/collection-api";
import { BrowseStorageTree } from "../BrowseStorageTree";

const STORAGE_UNIT_TYPE_NAME = "Type";

/** Top-level storage. */
const STORAGE_A: PersistedResource<StorageUnit> = {
  id: "A",
  group: "aafc",
  name: "A",
  type: "storage-unit",
  storageUnitType: {
    id: STORAGE_UNIT_TYPE_NAME,
    type: "storage-unit-type",
    name: STORAGE_UNIT_TYPE_NAME,
    group: "group",
  },
};

/** Units B and C are inside Unit A. */
const STORAGE_B: PersistedResource<StorageUnit> = {
  id: "B",
  group: "aafc",
  name: "B",
  type: "storage-unit",
  storageUnitType: {
    id: STORAGE_UNIT_TYPE_NAME,
    type: "storage-unit-type",
    name: STORAGE_UNIT_TYPE_NAME,
    group: "group",
  },
  parentStorageUnit: {
    id: "A",
    type: "storage-unit",
  } as PersistedResource<StorageUnit>,
};
const STORAGE_C: PersistedResource<StorageUnit> = {
  id: "C",
  group: "aafc",
  name: "C",
  type: "storage-unit",
  storageUnitType: {
    id: STORAGE_UNIT_TYPE_NAME,
    type: "storage-unit-type",
    name: STORAGE_UNIT_TYPE_NAME,
    group: "group",
  },
  parentStorageUnit: {
    id: "A",
    type: "storage-unit",
  } as PersistedResource<StorageUnit>,
};

/** D is inside C. */
const STORAGE_D: PersistedResource<StorageUnit> = {
  id: "D",
  group: "aafc",
  name: "D",
  type: "storage-unit",
  storageUnitType: {
    id: STORAGE_UNIT_TYPE_NAME,
    type: "storage-unit-type",
    name: STORAGE_UNIT_TYPE_NAME,
    group: "group",
  },
  parentStorageUnit: {
    id: "C",
    type: "storage-unit",
  } as PersistedResource<StorageUnit>,
};

const mockGet = jest.fn<any, any>(async (path, params = {}) => {
  switch (path) {
    case "collection-api/storage-unit":
      if (
        params.filter?.parentStorageUnit === null ||
        params.filter?.rsql === "group==aafc;group==cnc"
      ) {
        // Top-level units:
        return { data: [STORAGE_A], meta: { totalResourceCount: 1 } };
      } else if (params.filter?.rsql === "parentStorageUnit.uuid==A") {
        return {
          data: [STORAGE_B, STORAGE_C],
          meta: { totalResourceCount: 2 },
        };
      } else if (params.filter?.rsql === "parentStorageUnit.uuid==C") {
        return { data: [STORAGE_D], meta: { totalResourceCount: 1 } };
      } else if (params.filter?.rsql === "name==*test-search-text*") {
        return { data: [], meta: { totalResourceCount: 0 } };
      }
    case "collection-api/storage-unit-type":
      return { data: [], meta: { totalResourceCount: 0 } };
  }
});

const apiContext = {
  apiClient: {
    get: mockGet,
  },
};

const mockOnSelect = jest.fn();

describe("BrowseStorageTree component", () => {
  beforeEach(jest.clearAllMocks);

  it("Lets you navigate the tree and select a Storage Unit.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <BrowseStorageTree onSelect={mockOnSelect} />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Open the top-level unit to show the nested units "B" and "C":
    wrapper.find("svg.storage-collapser-icon").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Shows the nested storage units:
    expect(
      wrapper
        .find(".collapser-for-A .collapser-for-B a.storage-unit-name")
        .text()
    ).toEqual("B (" + STORAGE_UNIT_TYPE_NAME + ")");
    expect(
      wrapper
        .find(".collapser-for-A .collapser-for-C a.storage-unit-name")
        .text()
    ).toEqual("C (" + STORAGE_UNIT_TYPE_NAME + ")");

    // Select a storage:
    wrapper
      .find(".collapser-for-A .collapser-for-C button.select-storage")
      .simulate("click");

    expect(mockOnSelect).lastCalledWith(STORAGE_C);
  });

  it("Filters the list based on a text filter.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <BrowseStorageTree onSelect={mockOnSelect} />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // With no filter, gets the top-level units:
    expect(mockGet).lastCalledWith("collection-api/storage-unit", {
      filter: {
        rsql: "group==aafc;group==cnc",
      },
      include: "storageUnitChildren,storageUnitType",
      page: {
        limit: 100,
        offset: 0,
      },
      sort: "storageUnitType.name,name",
    });

    wrapper
      .find("input.storage-tree-search")
      .simulate("change", { target: { value: "test-search-text" } });
    wrapper.find("button.storage-tree-search").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // With a filter, gets units from any level matching the search text:
    expect(mockGet).lastCalledWith("collection-api/storage-unit", {
      filter: {
        rsql: "name==*test-search-text*;group==aafc;group==cnc",
      },
      include: "storageUnitChildren,storageUnitType",
      page: {
        limit: 100,
        offset: 0,
      },
      sort: "storageUnitType.name,name",
    });

    // Reset the search:
    wrapper.find("button.storage-tree-search-reset").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // No filter again:
    expect(mockGet).lastCalledWith("collection-api/storage-unit", {
      filter: {
        parentStorageUnit: null,
        rsql: "",
      },
      include: "storageUnitChildren,storageUnitType",
      page: {
        limit: 100,
        offset: 0,
      },
      sort: "storageUnitType.name,name",
    });
  });
});
