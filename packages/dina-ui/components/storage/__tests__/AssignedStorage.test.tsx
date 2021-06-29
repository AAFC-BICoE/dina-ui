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
  parentStorageUnit: {
    id: "B",
    group: "group",
    name: "B",
    type: "storage-unit",
    parentStorageUnit: {
      id: "C",
      group: "group",
      name: "C",
      type: "storage-unit",
      parentStorageUnit: {
        id: "D",
        group: "group",
        name: "D",
        type: "storage-unit",
        parentStorageUnit: {
          id: "E",
          group: "group",
          name: "E",
          type: "storage-unit"
        }
      }
    }
  }
};

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/storage-unit/A":
      return { data: STORAGE_A };
  }
});

const apiContext = {
  apiClient: {
    get: mockGet
  }
};

const mockOnChange = jest.fn();

describe("AssignedStorage component", () => {
  beforeEach(jest.clearAllMocks);

  it("Renders the storage unit path", async () => {
    const wrapper = mountWithAppContext(
      <AssignedStorage onChange={mockOnChange} value={STORAGE_A_SHALLOW} />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".storage-path").text()).toEqual("E > D > C > B > A");
  });

  it("Lets you remove the storage unit", async () => {
    const wrapper = mountWithAppContext(
      <AssignedStorage onChange={mockOnChange} value={STORAGE_A_SHALLOW} />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.remove-storage").simulate("click");
    expect(mockOnChange).lastCalledWith({ id: null });
  });
});
