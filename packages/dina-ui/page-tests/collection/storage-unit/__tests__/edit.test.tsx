import { PersistedResource } from "kitsu";
import { StorageUnitForm } from "../../../../components";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { StorageUnit } from "../../../../types/collection-api";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const STORAGE_UNIT_TYPE_NAME = "Type";

const PARENT_STORAGE_UNIT: PersistedResource<StorageUnit> = {
  id: "A",
  group: "test-group",
  type: "storage-unit",
  name: "A",
  isGeneric: false,
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
      return {
        data: [
          {
            id: "cabinet",
            type: "storage-unit-type",
            name: STORAGE_UNIT_TYPE_NAME
          }
        ]
      };
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

    // Test that A (Type) link is rendered
    expect(
      wrapper.getByText("A (" + STORAGE_UNIT_TYPE_NAME + ")")
    ).toBeInTheDocument();

    // Change Name field value
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: {
        value: "test-storage-unit"
      }
    });

    // Select Storage Unit Type
    userEvent.click(
      wrapper.getByRole("combobox", {
        name: /storage unit type type here to search\./i
      })
    );
    await new Promise(setImmediate);
    userEvent.click(wrapper.getByRole("option", { name: /type/i }));

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await new Promise(setImmediate);

    // Test expected API response
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              name: "test-storage-unit",
              isGeneric: false,
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
