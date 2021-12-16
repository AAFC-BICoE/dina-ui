import { PersistedResource } from "kitsu";
import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { StorageUnit } from "../../../types/collection-api";
import { StorageUnitChildrenViewer } from "../StorageUnitChildrenViewer";

const STORAGE_UNIT_CHILDREN = ["B", "C", "D"].map<
  PersistedResource<StorageUnit>
>(letter => ({
  id: letter,
  group: "group",
  name: letter,
  type: "storage-unit",
  storageUnitType: {
    id: "BOX",
    name: "Box",
    group: "test-group",
    type: "storage-unit-type"
  }
}));

// Initial container:
// A contains B,C,D
const STORAGE_A: PersistedResource<StorageUnit> = {
  id: "A",
  group: "group",
  name: "A",
  type: "storage-unit",
  storageUnitChildren: STORAGE_UNIT_CHILDREN
};

/** Target container. */
const STORAGE_B: PersistedResource<StorageUnit> = {
  id: "B",
  group: "group",
  name: "B",
  type: "storage-unit"
};

/** Storage unit with no parent */
const STORAGE_X: PersistedResource<StorageUnit> = {
  id: "X",
  group: "group",
  name: "X",
  type: "storage-unit"
};

// Just return what is passed to it:
const mockSave = jest.fn(async ops => ops.map(op => op.resource));
const mockPush = jest.fn();
const mockReload = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    reload: mockReload
  })
}));

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "collection-api/storage-unit":
      switch (params?.include) {
        case "hierarchy,storageUnitChildren,storageUnitType":
          switch (params?.filter?.rsql) {
            case "parentStorageUnit.uuid==A":
              // The initial Storage Unit's children:
              return {
                data: STORAGE_UNIT_CHILDREN,
                meta: { totalResourceCount: 3 }
              };
            case "parentStorageUnit.uuid==X":
              // The initial Storage Unit's children:
              return {
                data: [],
                meta: { totalResourceCount: 0 }
              };
          }
        case "hierarchy,storageUnitType":
          switch (params?.filter?.rsql) {
            case "":
              // The searchable table results:
              return {
                data: [STORAGE_B],
                meta: { totalResourceCount: 1 }
              };
          }
      }
    case "collection-api/storage-unit-type":
      return { data: [], meta: { totalResourceCount: 0 } };
    case "collection-api/storage-unit/A?include=storageUnitChildren":
      // The fetcher for all current children before executing the Save operation:
      return {
        data: STORAGE_A,
        meta: { totalResourceCount: 1 }
      };
    case "collection-api/storage-unit/X?include=storageUnitChildren":
      return { data: STORAGE_X };
    case "collection-api/material-sample":
      // Stored material samples:
      if (params?.filter?.rsql === "storageUnit.uuid==A") {
        return { data: [{ id: "ms-1", type: "material-sample" }] };
      } else {
        return { data: [{ id: "ms-1", type: "material-sample" }] };
      }
  }
});

const apiContext = {
  apiClient: {
    get: mockGet
  },
  save: mockSave
};

describe("StorageUnitChildrenViewer component", () => {
  beforeEach(jest.clearAllMocks);

  it("Shows the storage units chlidren", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <StorageUnitChildrenViewer parentId="A" />,
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".storage-unit-name").map(node => node.text())).toEqual(
      ["Box B", "Box C", "Box D"]
    );
  });

  it("Lets you move all stored samples and storages to another storage unit.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <StorageUnitChildrenViewer parentId="A" />,
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.enable-move-content").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.select-storage").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        ...STORAGE_UNIT_CHILDREN.map(unit => ({
          resource: {
            id: unit.id,
            type: "storage-unit",
            parentStorageUnit: { type: "storage-unit", id: "B" }
          },
          type: "storage-unit"
        })),
        {
          resource: {
            id: "ms-1",
            storageUnit: {
              id: "B",
              type: "storage-unit"
            },
            type: "material-sample"
          },
          type: "material-sample"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    // The browser is navigated to the new location:
    expect(mockPush).lastCalledWith("/collection/storage-unit/view?id=B");
  });

  it("Lets you move an existing Storage Unit into this Storage Unit", async () => {
    // Render a storage unit with no children:
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <StorageUnitChildrenViewer parentId="X" />,
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.add-existing-as-child").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.select-storage").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Updates B to set X as the new parent:
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            id: "B",
            type: "storage-unit",
            parentStorageUnit: { type: "storage-unit", id: "X" }
          },
          type: "storage-unit"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    // The browser is navigated to the new location:
    expect(mockReload).toHaveBeenCalledTimes(1);
  });
});
