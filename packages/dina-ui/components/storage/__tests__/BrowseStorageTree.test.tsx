import { PersistedResource } from "kitsu";
import { DinaForm } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { StorageUnit } from "../../../types/collection-api";
import { BrowseStorageTree } from "../BrowseStorageTree";
import { waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const STORAGE_UNIT_TYPE_NAME = "Type";

/** Top-level storage. */
const STORAGE_A: PersistedResource<StorageUnit> = {
  id: "A",
  group: "aafc",
  name: "A",
  type: "storage-unit",
  isGeneric: false,
  storageUnitType: {
    id: STORAGE_UNIT_TYPE_NAME,
    type: "storage-unit-type",
    name: STORAGE_UNIT_TYPE_NAME,
    group: "group"
  }
};

/** Units B and C are inside Unit A. */
const STORAGE_B: PersistedResource<StorageUnit> = {
  id: "B",
  group: "aafc",
  name: "B",
  type: "storage-unit",
  isGeneric: false,
  storageUnitType: {
    id: STORAGE_UNIT_TYPE_NAME,
    type: "storage-unit-type",
    name: STORAGE_UNIT_TYPE_NAME,
    group: "group"
  },
  parentStorageUnit: {
    id: "A",
    type: "storage-unit"
  } as PersistedResource<StorageUnit>
};
const STORAGE_C: PersistedResource<StorageUnit> = {
  id: "C",
  group: "aafc",
  name: "C",
  type: "storage-unit",
  isGeneric: false,
  storageUnitType: {
    id: STORAGE_UNIT_TYPE_NAME,
    type: "storage-unit-type",
    name: STORAGE_UNIT_TYPE_NAME,
    group: "group"
  },
  parentStorageUnit: {
    id: "A",
    type: "storage-unit"
  } as PersistedResource<StorageUnit>
};

/** D is inside C. */
const STORAGE_D: PersistedResource<StorageUnit> = {
  id: "D",
  group: "aafc",
  name: "D",
  type: "storage-unit",
  isGeneric: false,
  storageUnitType: {
    id: STORAGE_UNIT_TYPE_NAME,
    type: "storage-unit-type",
    name: STORAGE_UNIT_TYPE_NAME,
    group: "group"
  },
  parentStorageUnit: {
    id: "C",
    type: "storage-unit"
  } as PersistedResource<StorageUnit>
};

const mockGet = jest.fn<any, any>(async (path, params = {}) => {
  switch (path) {
    case "collection-api/storage-unit":
      const filter = params.filter || {};

      // Top-level units (no filter or empty filter or parentStorageUnit EQ null)
      if (
        filter.parentStorageUnit?.EQ === null ||
        filter?.group?.IN === "aafc,cnc"
      ) {
        return { data: [STORAGE_A], meta: { totalResourceCount: 1 } };
      } else if (filter["parentStorageUnit.uuid"]?.EQ === "A") {
        return {
          data: [STORAGE_B, STORAGE_C],
          meta: { totalResourceCount: 2 }
        };
      } else if (filter["parentStorageUnit.uuid"]?.EQ === "C") {
        return { data: [STORAGE_D], meta: { totalResourceCount: 1 } };
      } else if (filter.name?.ILIKE === "%test-search-text%") {
        return { data: [], meta: { totalResourceCount: 0 } };
      }
      // Default case for filtered results
      return { data: [], meta: { totalResourceCount: 0 } };
    case "collection-api/storage-unit-type":
      return { data: [], meta: { totalResourceCount: 0 } };
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
      <DinaForm initialValues={{}}>
        <BrowseStorageTree onSelect={mockOnSelect} />
      </DinaForm>,
      { apiContext }
    );
    await waitFor(() => {
      expect(
        wrapper.getByTestId("collapser-button-A").children[0]
      ).toBeInTheDocument();
    });

    // Open the top-level unit to show the nested units "B" and "C":
    userEvent.click(wrapper.getByTestId("collapser-button-A").children[0]);

    // Shows the nested storage units:
    await waitFor(() => {
      expect(
        wrapper.getByRole("link", { name: /b \(type\)/i })
      ).toBeInTheDocument();
      expect(
        wrapper.getByRole("link", { name: /c \(type\)/i })
      ).toBeInTheDocument();
    });

    // Select a storage:
    userEvent.click(
      within(wrapper.getByTestId("collapser-button-C")).getByRole("button")
    );

    await waitFor(() => {
      expect(mockOnSelect).lastCalledWith(STORAGE_C);
    });
  });

  it("Filters the list based on a text filter.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <BrowseStorageTree onSelect={mockOnSelect} />
      </DinaForm>,
      { apiContext }
    );

    // With no filter, gets the top-level units:
    await waitFor(() => {
      expect(mockGet).lastCalledWith("collection-api/storage-unit", {
        filter: {
          group: {
            IN: "aafc,cnc"
          }
        },
        include: "storageUnitChildren,storageUnitType",
        page: {
          limit: 100,
          offset: 0
        },
        sort: "storageUnitType.name,name"
      });
    });

    userEvent.type(
      wrapper.getByRole("textbox", { name: /name/i }),
      "test-search-text"
    );
    userEvent.click(wrapper.getByRole("button", { name: /search/i }));

    // With a filter, gets units from any level matching the search text:
    await waitFor(() => {
      expect(mockGet).lastCalledWith("collection-api/storage-unit", {
        filter: {
          name: { ILIKE: "%test-search-text%" },
          group: {
            IN: "aafc,cnc"
          }
        },
        include: "storageUnitChildren,storageUnitType",
        page: {
          limit: 100,
          offset: 0
        },
        sort: "storageUnitType.name,name"
      });
    });

    // Reset the search:
    userEvent.click(wrapper.getByRole("button", { name: /reset/i }));

    // No filter again (empty filter object):
    await waitFor(() => {
      const lastCall = mockGet.mock.calls[mockGet.mock.calls.length - 1];
      expect(lastCall[0]).toBe("collection-api/storage-unit");
      expect(lastCall[1]).toMatchObject({
        filter: {},
        include: "storageUnitChildren,storageUnitType",
        page: {
          limit: 100,
          offset: 0
        },
        sort: "storageUnitType.name,name"
      });
    });
  });
});
