import { mountWithAppContext } from "common-ui";
import { StorageUnitTypeForm } from "../../../../pages/collection/storage-unit-type/edit";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

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
    await wrapper.waitForRequests();

    // Change Name field value
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: { value: "test-storage-type" }
    });

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    // Test expected result
    expect(mockSave).toHaveBeenLastCalledWith(
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
    expect(mockOnSaved).toHaveBeenLastCalledWith({
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
    await wrapper.waitForRequests();

    // Change Name field value
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: { value: "edited-name" }
    });

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    // Test expected result
    expect(mockSave).toHaveBeenLastCalledWith(
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
    expect(mockOnSaved).toHaveBeenLastCalledWith({
      id: "333",
      group: "test-group",
      name: "edited-name",
      type: "storage-unit-type",
      createdBy: "Mat",
      createdOn: "2021-06-22"
    });
  });
});
