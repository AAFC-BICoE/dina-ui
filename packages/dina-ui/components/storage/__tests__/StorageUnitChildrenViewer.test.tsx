import { PersistedResource } from "kitsu";
import {
  DinaForm,
  STORAGE_UNIT_MAPPING,
  waitForLoadingToDisappear
} from "common-ui";
import { mountWithAppContext } from "common-ui";
import { StorageUnit } from "../../../types/collection-api";
import { StorageUnitChildrenViewer } from "../StorageUnitChildrenViewer";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { waitFor, screen, within } from "@testing-library/react";

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

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/storage-unit-type":
      return { data: [], meta: { totalResourceCount: 0 } };
    case "collection-api/storage-unit/A?optFields[storage-unit]=storageUnitChildren":
      // The fetcher for all current children before executing the Save operation:
      return {
        data: STORAGE_A,
        meta: { totalResourceCount: 1 }
      };
    case "collection-api/material-sample":
      return { data: [{ id: "ms-1", type: "material-sample" }] };
    case "search-api/search-ws/mapping":
      return STORAGE_UNIT_MAPPING;
    case "collection-api/storage-unit":
      // Fallback query when storageUnitChildren is undefined.
      return { data: [], meta: { totalResourceCount: 0 } };
  }
});

const MOCK_SEARCH_API_RESPONSE = {
  data: {
    took: 41,
    timed_out: false,
    _shards: {
      failed: {
        source: "0.0",
        parsedValue: 0
      },
      successful: {
        source: "1.0",
        parsedValue: 1
      },
      total: {
        source: "1.0",
        parsedValue: 1
      },
      skipped: {
        source: "0.0",
        parsedValue: 0
      }
    },
    hits: {
      total: {
        relation: "eq",
        value: 3
      },
      hits: [
        {
          _index: "dina_storage_index_20250709193641",
          _id: "019818d5-66d4-7d93-ba11-5c9bde019daf",
          _score: 0.13353139,
          _type: "_doc",
          _source: {
            data: {
              relationships: {
                storageUnitType: {
                  data: {
                    id: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    type: "storage-unit-type"
                  },
                  links: {
                    related:
                      "/api/v1/storage-unit/019818d5-66d4-7d93-ba11-5c9bde019daf/storageUnitType",
                    self: "/api/v1/storage-unit/019818d5-66d4-7d93-ba11-5c9bde019daf/relationships/storageUnitType"
                  }
                },
                parentStorageUnit: {
                  links: {
                    related:
                      "/api/v1/storage-unit/019818d5-66d4-7d93-ba11-5c9bde019daf/parentStorageUnit",
                    self: "/api/v1/storage-unit/019818d5-66d4-7d93-ba11-5c9bde019daf/relationships/parentStorageUnit"
                  }
                }
              },
              attributes: {
                createdBy: "dina-admin",
                hierarchy: [
                  {
                    typeUuid: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    name: "test unit",
                    typeName: "test",
                    rank: 1,
                    type: "1",
                    uuid: "019818d5-66d4-7d93-ba11-5c9bde019daf"
                  }
                ],
                name: "test unit",
                createdOn: "2025-07-17T14:41:35.436909Z",
                group: "aafc"
              },
              id: "019818d5-66d4-7d93-ba11-5c9bde019daf",
              type: "storage-unit"
            },
            included: [
              {
                attributes: {
                  name: "test"
                },
                id: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                type: "storage-unit-type"
              }
            ]
          }
        },
        {
          _index: "dina_storage_index_20250709193641",
          _id: "019818e5-7242-7e45-bcb1-0056d9fe6e34",
          _score: 0.13353139,
          _type: "_doc",
          _source: {
            data: {
              relationships: {
                storageUnitType: {
                  data: {
                    id: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    type: "storage-unit-type"
                  },
                  links: {
                    related:
                      "/api/v1/storage-unit/019818e5-7242-7e45-bcb1-0056d9fe6e34/storageUnitType",
                    self: "/api/v1/storage-unit/019818e5-7242-7e45-bcb1-0056d9fe6e34/relationships/storageUnitType"
                  }
                },
                parentStorageUnit: {
                  links: {
                    related:
                      "/api/v1/storage-unit/019818e5-7242-7e45-bcb1-0056d9fe6e34/parentStorageUnit",
                    self: "/api/v1/storage-unit/019818e5-7242-7e45-bcb1-0056d9fe6e34/relationships/parentStorageUnit"
                  }
                }
              },
              attributes: {
                createdBy: "dina-admin",
                hierarchy: [
                  {
                    typeUuid: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    name: "test unit child",
                    typeName: "test",
                    rank: 1,
                    type: "1",
                    uuid: "019818e5-7242-7e45-bcb1-0056d9fe6e34"
                  },
                  {
                    typeUuid: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    name: "test unit",
                    typeName: "test",
                    rank: 2,
                    type: "1",
                    uuid: "019818d5-66d4-7d93-ba11-5c9bde019daf"
                  }
                ],
                name: "test unit child",
                createdOn: "2025-07-17T14:59:06.928123Z",
                group: "aafc"
              },
              id: "019818e5-7242-7e45-bcb1-0056d9fe6e34",
              type: "storage-unit"
            },
            included: [
              {
                attributes: {
                  name: "test"
                },
                id: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                type: "storage-unit-type"
              }
            ]
          }
        },
        {
          _index: "dina_storage_index_20250709193641",
          _id: "01981eef-fea7-7570-bcd8-080fa74273c4",
          _score: 0.13353139,
          _type: "_doc",
          _source: {
            data: {
              relationships: {
                storageUnitType: {
                  data: {
                    id: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    type: "storage-unit-type"
                  },
                  links: {
                    related:
                      "/api/v1/storage-unit/01981eef-fea7-7570-bcd8-080fa74273c4/storageUnitType",
                    self: "/api/v1/storage-unit/01981eef-fea7-7570-bcd8-080fa74273c4/relationships/storageUnitType"
                  }
                },
                parentStorageUnit: {
                  links: {
                    related:
                      "/api/v1/storage-unit/01981eef-fea7-7570-bcd8-080fa74273c4/parentStorageUnit",
                    self: "/api/v1/storage-unit/01981eef-fea7-7570-bcd8-080fa74273c4/relationships/parentStorageUnit"
                  }
                }
              },
              attributes: {
                createdBy: "dina-admin",
                hierarchy: [
                  {
                    typeUuid: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    name: "test unit child 2",
                    typeName: "test",
                    rank: 1,
                    type: "1",
                    uuid: "01981eef-fea7-7570-bcd8-080fa74273c4"
                  },
                  {
                    typeUuid: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                    name: "test unit",
                    typeName: "test",
                    rank: 2,
                    type: "1",
                    uuid: "019818d5-66d4-7d93-ba11-5c9bde019daf"
                  }
                ],
                name: "test unit child 2",
                createdOn: "2025-07-18T19:08:21.530999Z",
                group: "aafc"
              },
              id: "01981eef-fea7-7570-bcd8-080fa74273c4",
              type: "storage-unit"
            },
            included: [
              {
                attributes: {
                  name: "test"
                },
                id: "019818d2-e799-7972-b1b1-74cb3cc0efc4",
                type: "storage-unit-type"
              }
            ]
          }
        }
      ],
      max_score: 0.13353139
    }
  }
};

const mockPost = jest.fn<any, any>(async (path) => {
  switch (path) {
    // Elastic search response with object store mock metadata data.
    case "search-api/search-ws/search":
      return Promise.resolve(MOCK_SEARCH_API_RESPONSE);
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

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      post: mockPost,
      axios: {
        get: mockGet,
        post: mockPost
      }
    },
    save: mockSave,
    bulkGet: mockBulkGet,
    accountContext: { groupNames: ["aafc", "cnc", "overy-lab"] }
  }
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
      testCtx as any
    );

    // The page should load initially with a loading spinner.
    await waitForLoadingToDisappear();

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

  it.skip("Lets you move all stored samples and storages to another storage unit.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <StorageUnitChildrenViewer
          storageUnit={storageUnitA}
          materialSamples={undefined}
        />
        ,
      </DinaForm>,
      testCtx as any
    );

    await waitFor(() =>
      expect(
        wrapper.getByRole("button", { name: /move all content/i })
      ).toBeInTheDocument()
    );
    // Click "Move All Content" button
    await userEvent.click(
      wrapper.getByRole("button", { name: /move all content/i })
    );

    await waitFor(() =>
      expect(
        wrapper.getAllByRole("button", { name: /select/i })[0]
      ).toBeInTheDocument()
    );
    // Click "Select" button for B (Box) storage unit
    await userEvent.click(
      wrapper.getAllByRole("button", { name: /select/i })[0]
    );

    await waitFor(() => {
      // Test expected API Call
      expect(mockSave).lastCalledWith(
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
      expect(mockPush).lastCalledWith("/collection/storage-unit/view?id=B");
    });
  });

  it("Lets you move an existing Storage Unit into this Storage Unit", async () => {
    // Render with ADD_EXISTING_AS_CHILD mode active
    mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <StorageUnitChildrenViewer
          storageUnit={storageUnitX}
          materialSamples={undefined}
          actionMode="ADD_EXISTING_AS_CHILD"
          onCancelAction={jest.fn()}
        />
        ,
      </DinaForm>,
      testCtx as any
    );
    await waitForLoadingToDisappear();

    const row = await screen.findByRole("row", {
      name: /test unit child 2 opens in new tab test opens in new tab test unit aafc dina\-admin 2025\-07\-18, 7:08:21 p\.m\. select/i
    });
    await userEvent.click(within(row).getByRole("button", { name: /select/i }));

    await waitFor(() => {
      // Updates B to set X as the new parent:
      expect(mockSave).lastCalledWith(
        [
          {
            resource: {
              id: "01981eef-fea7-7570-bcd8-080fa74273c4",
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
});
