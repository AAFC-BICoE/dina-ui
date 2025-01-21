import { PersistedResource } from "kitsu";
import { DinaForm } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { StorageUnit } from "../../../types/collection-api";
import { StorageUnitChildrenViewer } from "../StorageUnitChildrenViewer";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const STORAGE_UNIT_CHILDREN = ["B", "C", "D"].map<
  PersistedResource<StorageUnit>
>((letter) => ({
  id: letter,
  group: "group",
  name: letter,
  type: "storage-unit",
  isGeneric: false,
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
  isGeneric: false,
  storageUnitChildren: STORAGE_UNIT_CHILDREN
};

/** Target container. */
const STORAGE_B: PersistedResource<StorageUnit> = {
  id: "B",
  group: "group",
  name: "B",
  isGeneric: false,
  type: "storage-unit"
};

// Just return what is passed to it:
const mockSave = jest.fn(async (ops) => ops.map((op) => op.resource));
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
            case "uuid!=X;group=in=(aafc,cnc,overy-lab)":
            case "group=in=(aafc,cnc,overy-lab)":
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
    case "collection-api/material-sample":
      // Stored material samples:
      if (params?.filter?.rsql === "storageUnitUsage.storageUnit.uuid==A") {
        return { data: [{ id: "ms-1", type: "material-sample" }] };
      } else {
        return { data: [{ id: "ms-1", type: "material-sample" }] };
      }
  }
});
function arrayEquals(a, b) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  );
}

const mockBulkGet = jest.fn<any, any>(async (paths) => {
  const storageUnitChildrenPaths = [
    "/storage-unit/B?include=storageUnitType",
    "/storage-unit/C?include=storageUnitType",
    "/storage-unit/D?include=storageUnitType"
  ];
  if (arrayEquals(paths, storageUnitChildrenPaths)) {
    return STORAGE_UNIT_CHILDREN;
  }
});

const apiContext = {
  apiClient: {
    get: mockGet
  },
  save: mockSave,
  bulkGet: mockBulkGet
};

const storageUnitA: StorageUnit = {
  type: "storage-unit",
  id: "A",
  name: "testNameA",
  group: "aafc",
  isGeneric: false,
  storageUnitChildren: STORAGE_UNIT_CHILDREN
};

const storageUnitX: StorageUnit = {
  type: "storage-unit",
  id: "X",
  name: "testNameX",
  group: "aafc",
  isGeneric: false
};

describe("StorageUnitChildrenViewer component", () => {
  beforeEach(jest.clearAllMocks);

  it("Shows the storage units children.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <StorageUnitChildrenViewer
          storageUnit={storageUnitA}
          materialSamples={undefined}
        />
        ,
      </DinaForm>,
      { apiContext }
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();

    await wrapper.waitForRequests();

    expect(wrapper.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();

    // Test expected links that show storage units children
    expect(
      wrapper.getByRole("link", { name: /b \(box\)/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("link", { name: /c \(box\)/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("link", { name: /d \(box\)/i })
    ).toBeInTheDocument();
  });

  it("Lets you move all stored samples and storages to another storage unit.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <StorageUnitChildrenViewer
          storageUnit={storageUnitA}
          materialSamples={undefined}
        />
        ,
      </DinaForm>,
      {
        apiContext,
        accountContext: { groupNames: ["aafc", "cnc", "overy-lab"] }
      }
    );
    await wrapper.waitForRequests();

    // Click "Move All Content" button
    userEvent.click(wrapper.getByRole("button", { name: /move all content/i }));

    await wrapper.waitForRequests();

    // Click "Select" button for B (Box) storage unit
    userEvent.click(wrapper.getAllByRole("button", { name: /select/i })[0]);

    await wrapper.waitForRequests();

    // Test expected API Call
    expect(mockSave).toHaveBeenLastCalledWith(
      [
        ...STORAGE_UNIT_CHILDREN.map((unit) => ({
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
    expect(mockPush).toHaveBeenLastCalledWith(
      "/collection/storage-unit/view?id=B"
    );
  });

  it("Lets you move an existing Storage Unit into this Storage Unit", async () => {
    // Render a storage unit with no children:
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <StorageUnitChildrenViewer
          storageUnit={storageUnitX}
          materialSamples={undefined}
        />
        ,
      </DinaForm>,
      {
        apiContext,
        accountContext: { groupNames: ["aafc", "cnc", "overy-lab"] }
      }
    );
    await wrapper.waitForRequests();

    // Click "Add Existing Storage Unit" button
    userEvent.click(
      wrapper.getByRole("button", { name: /add existing storage unit/i })
    );

    await wrapper.waitForRequests();

    // Click "Select" button to select storage B
    userEvent.click(wrapper.getByRole("button", { name: /select/i }));

    await wrapper.waitForRequests();

    // Updates B to set X as the new parent:
    expect(mockSave).toHaveBeenLastCalledWith(
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
