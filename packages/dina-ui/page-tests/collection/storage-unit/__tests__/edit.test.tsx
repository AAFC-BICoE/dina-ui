import { PersistedResource } from "kitsu";
import { StorageUnitForm } from "../../../../components";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { StorageUnit } from "../../../../types/collection-api";

const STORAGE_UNIT_TYPE_NAME = "Type";

const PARENT_STORAGE_UNIT: PersistedResource<StorageUnit> = {
  id: "A",
  group: "test-group",
  type: "storage-unit",
  name: "A",
  storageUnitType: {
    id: STORAGE_UNIT_TYPE_NAME,
    type: "storage-unit-type",
    name: STORAGE_UNIT_TYPE_NAME,
    group: "group"
  }
};

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/storage-unit/A":
      return { data: PARENT_STORAGE_UNIT };
    case "collection-api/storage-unit-type":
      return { data: [] };
    case "user-api/group":
      return { data: [] };
  }
});

const mockSave = jest.fn(async (saves) => {
  return saves.map((save) => ({
    ...save.resource,
    id: save.resource.id ?? "123"
  }));
});

const apiContext = {
  save: mockSave,
  apiClient: {
    get: mockGet
  }
};

const mockOnSaved = jest.fn();

describe("Storage Unit edit page.", () => {
  beforeEach(jest.clearAllMocks);

  it("Adds a new Storage Unit with a pre-linked parent", async () => {
    const wrapper = mountWithAppContext(
      <StorageUnitForm
        onSaved={mockOnSaved}
        initialParent={PARENT_STORAGE_UNIT}
      />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper
        .find(".storage-path li.breadcrumb-item")
        .map((node) => node.text())
    ).toEqual(["A (" + STORAGE_UNIT_TYPE_NAME + ")"]);

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "test-storage-unit" } });
    wrapper.find(".storageUnitType-field ResourceSelect").prop<any>("onChange")(
      { id: "cabinet", type: "storage-unit-type", name: "Cabinet" }
    );

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              name: "test-storage-unit",
              parentStorageUnit: expect.objectContaining({
                id: "A",
                type: "storage-unit"
              }),
              storageUnitType: expect.objectContaining({
                id: "cabinet",
                type: "storage-unit-type"
              }),
              type: "storage-unit"
            },
            type: "storage-unit"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });
});
