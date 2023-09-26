import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { StorageUnitTypeForm } from "../../../../pages/collection/storage-unit-type/edit";

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
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

describe("Storage Unit Type form.", () => {
  beforeEach(jest.clearAllMocks);

  it("Lets you add a new Storage Type", async () => {
    const wrapper = mountWithAppContext(
      <StorageUnitTypeForm onSaved={mockOnSaved} />,
      { apiContext }
    );
    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "test-storage-type" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            name: "test-storage-type",
            type: "storage-unit-type"
          },
          type: "storage-unit-type"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    expect(mockOnSaved).lastCalledWith({
      id: "123",
      name: "test-storage-type",
      type: "storage-unit-type"
    });
  });

  it("Lets you edit a Storage Type", async () => {
    const wrapper = mountWithAppContext(
      <StorageUnitTypeForm
        onSaved={mockOnSaved}
        storageUnitType={{
          id: "333",
          group: "test-group",
          name: "test-existing",
          type: "storage-unit-type",
          createdBy: "Mat",
          createdOn: "2021-06-22"
        }}
      />,
      { apiContext }
    );
    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "edited-name" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            id: "333",
            group: "test-group",
            name: "edited-name",
            type: "storage-unit-type",
            createdBy: "Mat",
            createdOn: "2021-06-22"
          },
          type: "storage-unit-type"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    expect(mockOnSaved).lastCalledWith({
      id: "333",
      group: "test-group",
      name: "edited-name",
      type: "storage-unit-type",
      createdBy: "Mat",
      createdOn: "2021-06-22"
    });
  });
});
