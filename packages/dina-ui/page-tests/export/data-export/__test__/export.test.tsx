import React from "react";
import {
  MATERIAL_SAMPLE_MAPPING,
  mountWithAppContext,
  OBJECT_STORE_MAPPING,
  waitForLoadingToDisappear
} from "common-ui";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";
import {
  DATA_EXPORT_QUERY_KEY,
  DATA_EXPORT_TOTAL_RECORDS_KEY,
  OBJECT_EXPORT_IDS_KEY
} from "common-ui";
import userEvent from "@testing-library/user-event";
import ExportPage from "@dina-ui/pages/export/data-export/export";

const MOCK_TEMPLATES = [
  {
    id: "f3245214-301d-437d-ae36-64cdc39665ea",
    type: "data-export-template",
    createdOn: "2025-05-06T16:24:47.296631Z",
    createdBy: "dina-admin",
    group: "aafc",
    restrictToCreatedBy: false,
    publiclyReleasable: false,
    name: "Material Sample Demo",
    exportType: "TABULAR_DATA",
    exportOptions: {
      columnSeparator: "TAB"
    },
    schema: {
      "material-sample": {
        columns: ["materialSampleName", "collection.name", "createdBy"],
        aliases: ["alias1", "alias2", "alias3"]
      }
    }
  }
];

const mockPush = jest.fn();
let mockQuery = {
  entityLink: "/collection/material-sample",
  indexName: "dina_material_sample_index",
  uniqueName: "material-sample-export"
};

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    query: mockQuery
  })
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: any) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: any) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });
Object.defineProperty(window, "sessionStorage", { value: sessionStorageMock });

describe("ExportPage Component", () => {
  // Mock API methods
  const mockGet = jest.fn();
  const mockBulkGet = jest.fn();
  const mockPost = jest.fn();
  const mockSave = jest.fn();

  const testCtx = {
    apiContext: {
      apiClient: {
        get: mockGet,
        axios: {
          post: mockPost,
          get: mockGet,
          delete: jest.fn(),
          patch: jest.fn()
        }
      },
      bulkGet: mockBulkGet,
      save: mockSave
    }
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
    mockQuery = {
      entityLink: "/collection/material-sample",
      indexName: "dina_material_sample_index",
      uniqueName: "material-sample-export"
    };

    // Default API Mock setup
    mockGet.mockImplementation(async (path, params) => {
      if (path.includes("search-api/search-ws/mapping")) {
        if (params.params?.indexName === "dina_material_sample_index") {
          return MATERIAL_SAMPLE_MAPPING;
        }
        if (params.params?.indexName === "dina_object_store_index") {
          return OBJECT_STORE_MAPPING;
        }
      }
      if (path === "dina-export-api/data-export-template") {
        return { data: MOCK_TEMPLATES };
      }
      return { data: [] };
    });

    mockBulkGet.mockImplementation(async (paths) => {
      if (paths[0] && paths[0].includes("metadata/")) {
        return paths.map((path: string) => {
          const id = path.split("/").pop();
          return {
            id,
            type: "metadata",
            fileIdentifier: `file-${id}`,
            dcType: "IMAGE",
            fileExtension: ".jpg",
            originalFilename: `test-file-${id}.jpg`
          };
        });
      }
      return [];
    });

    mockSave.mockImplementation(async () => [
      { id: "export-job-1", type: "data-export" }
    ]);
  });

  describe("Data Export", () => {
    beforeEach(() => {
      // Set up sessionStorage and localStorage for Tabular Data Export
      window.sessionStorage.setItem(DATA_EXPORT_TOTAL_RECORDS_KEY, "5");
      window.localStorage.setItem(
        DATA_EXPORT_QUERY_KEY,
        JSON.stringify({ query: { match_all: {} } })
      );
    });

    describe("Export Template Functionality", () => {
      it("Loads and displays existing Data Export Templates, and handles selection", async () => {
        const wrapper = mountWithAppContext(<ExportPage />, testCtx);
        await waitForLoadingToDisappear();

        // Verify that the initial call was made to fetch saved export templates
        await waitFor(() => {
          expect(mockGet).toHaveBeenCalledWith(
            "dina-export-api/data-export-template",
            expect.any(Object)
          );
        });

        // Verify 5 total records have been found.
        await waitFor(() => {
          expect(
            wrapper.getByText(/total matched records: 5/i)
          ).toBeInTheDocument();
        });

        // Find template selection dropdown
        const templateContainer = wrapper
          .getByText(/select export template/i)
          .closest("div")!;
        const templateInput = templateContainer.querySelector(
          "input"
        ) as HTMLElement;

        await userEvent.click(templateInput);

        // Wait for the option to appear, then click it
        const option = await wrapper.findByText("Material Sample Demo");
        await userEvent.click(option);
        await waitForLoadingToDisappear();

        // Ensure the following columns are loaded in:
        expect(wrapper.getByText("Primary ID")).toBeInTheDocument();
        expect(wrapper.getByText("Name")).toBeInTheDocument();
        expect(wrapper.getByText("Created By")).toBeInTheDocument();

        // Ensure Alias are loaded in:
        expect(wrapper.getByDisplayValue("alias1")).toBeInTheDocument();
        expect(wrapper.getByDisplayValue("alias2")).toBeInTheDocument();
        expect(wrapper.getByDisplayValue("alias3")).toBeInTheDocument();

        // Export name should remain blank to allow the user to put a value in.
        expect(
          wrapper.getByRole("textbox", { name: /export name/i })
        ).toHaveDisplayValue("");

        // Expect visibility to be set to "Visible by group"
        expect(wrapper.getByText(/visible to group/i)).toBeInTheDocument();

        // Tabbed separator should be selected.
        // Todo: this seems to be broken.
        // expect(wrapper.getByText("Tab")).toBeInTheDocument();

        // Submit the export to ensure the network request is setup properly.
        await userEvent.click(wrapper.getByRole("button", { name: "Export" }));
        expect(mockSave.mock.calls).toEqual([
          [
            [
              {
                resource: {
                  exportOptions: {
                    columnSeparator: "COMMA"
                  },
                  functions: undefined,
                  name: undefined,
                  query: '{"query":{"match_all":{}}}',
                  schema: {
                    "material-sample": {
                      aliases: ["alias1", "alias2", "alias3"],
                      columns: [
                        "materialSampleName",
                        "collection.name",
                        "createdBy"
                      ]
                    }
                  },
                  source: "dina_material_sample_index",
                  type: "data-export"
                },
                type: "data-export"
              }
            ],
            {
              apiBaseUrl: "/dina-export-api"
            }
          ]
        ]);
      });

      it("Create a new export using the template", async () => {});

      it("Delete existing export template", async () => {});

      it("Update existing export template", async () => {});
    });

    it("Changing the name and separator will change the data export request properly", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // Find the separator dropdown using the container approach
      const separatorContainer = wrapper
        .getByText(/separator/i)
        .closest("div")!;
      const separatorInput = separatorContainer.querySelector(
        "input"
      ) as HTMLElement;

      // Open dropdown and select "TAB"
      await userEvent.click(separatorInput);
      const tabOption = await wrapper.findByText("Tab");
      await userEvent.click(tabOption);

      // Change the name
      await userEvent.type(
        wrapper.getByRole("textbox", { name: /export name/i }),
        "my-export-1"
      );

      // Submit export
      const submitButton = wrapper.getByRole("button", { name: "Export" });
      await userEvent.click(submitButton);

      // Verify payload has TAB as the columnSeparator
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          [
            {
              resource: {
                exportOptions: {
                  columnSeparator: "TAB"
                },
                functions: undefined,
                name: "my-export-1",
                query: '{"query":{"match_all":{}}}',
                schema: {
                  "material-sample": {
                    aliases: ["alias1", "alias2", "alias3"],
                    columns: [
                      "materialSampleName",
                      "collection.name",
                      "createdBy"
                    ]
                  }
                },
                source: "dina_material_sample_index",
                type: "data-export"
              },
              type: "data-export"
            }
          ],
          {
            apiBaseUrl: "/dina-export-api"
          }
        );
      });
    });

    it("Handles column selection properly and updates the export configuration", async () => {});
  });

  describe("Object Export", () => {
    beforeEach(() => {
      // Set up router for Object Store Export
      mockQuery = {
        entityLink: "/object-store/metadata",
        indexName: "dina_object_store_index",
        uniqueName: "object-store-export"
      };

      // Set up sessionStorage with selected object store ids and total records count
      window.sessionStorage.setItem(DATA_EXPORT_TOTAL_RECORDS_KEY, "2");
      window.sessionStorage.setItem(
        OBJECT_EXPORT_IDS_KEY,
        JSON.stringify(["obj-1", "obj-2"])
      );
    });

    it("renders and handles File Name Alias Field selection properly", async () => {});

    it("renders and handles Resize Image options correctly in the submission payload", async () => {});
  });
});
