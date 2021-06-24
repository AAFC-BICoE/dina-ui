import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { StorageUnit } from "../../../types/collection-api";
import { BrowseStorageTree } from "../BrowseStorageTree";

/** Top-level storage. */
const STORAGE_A: PersistedResource<StorageUnit> = {
  id: "A",
  group: "group",
  name: "A",
  type: "storage-unit"
};

/** Units B and C are inside Unit A. */
const STORAGE_B: PersistedResource<StorageUnit> = {
  id: "B",
  group: "group",
  name: "B",
  type: "storage-unit",
  parentStorageUnit: {
    id: "A",
    type: "storage-unit"
  } as PersistedResource<StorageUnit>
};
const STORAGE_C: PersistedResource<StorageUnit> = {
  id: "C",
  group: "group",
  name: "C",
  type: "storage-unit",
  parentStorageUnit: {
    id: "A",
    type: "storage-unit"
  } as PersistedResource<StorageUnit>
};

/** D is inside C. */
const STORAGE_D: PersistedResource<StorageUnit> = {
  id: "D",
  group: "group",
  name: "D",
  type: "storage-unit",
  parentStorageUnit: {
    id: "C",
    type: "storage-unit"
  } as PersistedResource<StorageUnit>
};

const mockGet = jest.fn<any, any>(async (path, params = {}) => {
  switch (path) {
    case "collection-api/storage-unit":
      if (params.filter?.parentStorageUnit === null) {
        return { data: [STORAGE_A], meta: { totalResourceCount: 1 } };
      } else if (params.filter?.rsql === "parentStorageUnit.uuid==A") {
        return {
          data: [STORAGE_B, STORAGE_C],
          meta: { totalResourceCount: 2 }
        };
      } else if (params.filter?.rsql === "parentStorageUnit.uuid==C") {
        return { data: [STORAGE_D], meta: { totalResourceCount: 1 } };
      }
  }
});

const apiContext = {
  apiClient: {
    get: mockGet
  }
};

const mockOnSelect = jest.fn();

describe("BrowseStorageTree component", () => {
  beforeEach(jest.clearAllMocks);

  it("Lets you navigate the tree and select a Storage Unit.", async () => {
    const wrapper = mountWithAppContext(
      <BrowseStorageTree onSelect={mockOnSelect} />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Shows the top-level storage units:
    expect(wrapper.find("a.storage-unit-name").text()).toEqual("A");

    // Open the top-level unit to show the nested units "B" and "C":
    wrapper.find("svg.storage-collapser-icon").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Shows the nested storage units:
    expect(
      wrapper
        .find(".collapser-for-A .collapser-for-B a.storage-unit-name")
        .text()
    ).toEqual("B");
    expect(
      wrapper
        .find(".collapser-for-A .collapser-for-C a.storage-unit-name")
        .text()
    ).toEqual("C");

    // Select a storage:
    wrapper
      .find(".collapser-for-A .collapser-for-C button.select-storage")
      .simulate("click");

    expect(mockOnSelect).lastCalledWith(STORAGE_C);
  });

  it("Can disable a Storage node and its children from being selectable.", async () => {
    // Disable selecting anything from C down.
    const wrapper = mountWithAppContext(
      <BrowseStorageTree onSelect={mockOnSelect} excludeOptionId="C" />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Shows the top-level storage units:
    expect(wrapper.find("a.storage-unit-name").text()).toEqual("A");

    // Open the top-level unit to show the nested units "B" and "C":
    wrapper.find("svg.storage-collapser-icon").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Shows the nested C Unit:
    expect(
      wrapper
        .find(".collapser-for-A .collapser-for-C a.storage-unit-name")
        .text()
    ).toEqual("C");

    // Open the C unit:
    wrapper
      .find(".collapser-for-C svg.storage-collapser-icon")
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Shows the nested D Unit:
    expect(
      wrapper
        .find(".collapser-for-C .collapser-for-D a.storage-unit-name")
        .text()
    ).toEqual("D");

    // C and its nested D are disabled:
    expect(
      wrapper
        .find(".collapser-for-A .collapser-for-C button.select-storage")
        .first()
        .prop("disabled")
    ).toEqual(true);
    expect(
      wrapper
        .find(".collapser-for-C .collapser-for-D button.select-storage")
        .first()
        .prop("disabled")
    ).toEqual(true);
  });
});
