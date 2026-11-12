import { PersistedResource } from "kitsu";
import { StorageUnitForm } from "../../../../components";
import { clearAndType, mountWithAppContext } from "common-ui";
import {
  ControlledVocabularyItem,
  StorageUnit
} from "../../../../types/collection-api";
import { fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const STORAGE_UNIT_TYPE_NAME = "Type";

const TEST_MANAGED_ATTRIBUTE: PersistedResource<ControlledVocabularyItem> = {
  id: "verbatim-family",
  type: "controlled-vocabulary-item",
  key: "verbatim_family",
  name: "Verbatim family",
  group: "test-group",
  dinaComponent: "STORAGE_UNIT",
  vocabularyElementType: "STRING"
};

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
      return { data: [{ name: "aafc", labels: { en: "AAFC" } }] };
    case "collection-api/controlled-vocabulary-item":
      return { data: [TEST_MANAGED_ATTRIBUTE] };
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

    // Test that A (Type) link is rendered
    await waitFor(() => {
      expect(
        wrapper.getByText("A (" + STORAGE_UNIT_TYPE_NAME + ")")
      ).toBeInTheDocument();
    });

    // Change Name field value
    await clearAndType(
      wrapper.getByRole("textbox", { name: /name/i }),
      "test-storage-unit"
    );

    // Select Storage Unit Type
    await userEvent.click(
      wrapper.getByRole("combobox", {
        name: /storage unit type type here to search\./i
      })
    );
    await waitFor(() => {
      expect(
        wrapper.getByRole("option", { name: /type/i })
      ).toBeInTheDocument();
    });
    await userEvent.click(wrapper.getByRole("option", { name: /type/i }));

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected API response
    await waitFor(() => {
      expect(mockSave.mock.calls).toEqual([
        [
          [
            {
              resource: {
                name: "test-storage-unit",
                isGeneric: false,
                group: "aafc",
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

  it("Loads, edits and saves a Storage Unit managed attribute", async () => {
    const storageUnit: PersistedResource<StorageUnit> = {
      ...PARENT_STORAGE_UNIT,
      managedAttributes: {
        verbatim_family: "Carabidae"
      }
    };

    const wrapper = mountWithAppContext(
      <StorageUnitForm storageUnit={storageUnit} onSaved={mockOnSaved} />,
      { apiContext }
    );

    const managedAttributeInput = await wrapper.findByDisplayValue("Carabidae");

    await clearAndType(managedAttributeInput, "Carabidae (historical)");

    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(mockSave).toHaveBeenLastCalledWith(
        [
          {
            resource: expect.objectContaining({
              id: "A",
              managedAttributes: {
                verbatim_family: "Carabidae (historical)"
              }
            }),
            type: "storage-unit"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      );
    });
  });
});
