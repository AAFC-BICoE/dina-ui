import { PersistedResource } from "kitsu";
import { DinaForm } from "../../../../common-ui/lib";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { StorageUnit } from "../../../types/collection-api";
import { StorageUnitChildrenViewer } from "../StorageUnitChildrenViewer";

const STORAGE_UNIT_CHILDREN = ["B", "C", "D"].map(letter => ({
  id: letter,
  group: "group",
  name: letter,
  type: "storage-unit" as const
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

// Just return what is passed to it:
const mockSave = jest.fn(async ops => ops.map(op => op.resource));
const mockPush = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "collection-api/storage-unit":
      switch (params?.include) {
        case "hierarchy,storageUnitChildren":
          switch (params?.filter?.rsql) {
            case "parentStorageUnit.uuid==A":
              // The initial Storage Unit's children:
              return {
                data: STORAGE_UNIT_CHILDREN,
                meta: { totalResourceCount: 3 }
              };
          }
        case "hierarchy,storageUnitType":
          switch (params?.filter?.rsql) {
            case "uuid!=00000000-0000-0000-0000-000000000000":
              // The searchable table results:
              return { data: [STORAGE_B], meta: { totalResourceCount: 0 } };
          }
      }
    case "collection-api/storage-unit-type":
      return { data: [] };
    case "collection-api/storage-unit/A/storageUnitChildren":
      // The fetcher for all current children before executing the Save operation:
      return { data: STORAGE_UNIT_CHILDREN };
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

  it("Shows the storage unit's chlidren.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <StorageUnitChildrenViewer parentId="A" />,
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".storage-unit-name").map(node => node.text())).toEqual(
      ["B", "C", "D"]
    );
  });

  it("Lets you move all children to another storage unit.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <StorageUnitChildrenViewer parentId="A" />,
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.enable-move-content").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.select-storage").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      STORAGE_UNIT_CHILDREN.map(unit => ({
        resource: {
          id: unit.id,
          type: "storage-unit",
          parentStorageUnit: { type: "storage-unit", id: "B" }
        },
        type: "storage-unit"
      })),
      { apiBaseUrl: "/collection-api" }
    );
    // The browser is navigated to the new location:
    expect(mockPush).lastCalledWith("/collection/storage-unit/view?id=B");
  });
});
