import { mountWithAppContext2 } from "../../../../test-util/mock-app-context";
import { StorageUnitTypeForm } from "../../../../pages/collection/storage-unit-type/edit";
import { fireEvent, screen } from "@testing-library/react";
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
    const wrapper = mountWithAppContext2(
      <StorageUnitTypeForm onSaved={mockOnSaved} />,
      { apiContext }
    );
    await new Promise(setImmediate);

    // Change Name field value
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: { value: "test-storage-type" }
    });

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await new Promise(setImmediate);

    // Test expected result
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
    const wrapper = mountWithAppContext2(
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

    // wrapper
    //   .find(".name-field input")
    //   .simulate("change", { target: { value: "edited-name" } });
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: { value: "edited-name" }
    });

    // wrapper.find("form").simulate("submit");
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await new Promise(setImmediate);

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
