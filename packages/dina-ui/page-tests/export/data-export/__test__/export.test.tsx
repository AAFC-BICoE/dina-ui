import React from "react";
import {
  MATERIAL_SAMPLE_MAPPING,
  mountWithAppContext,
  OBJECT_STORE_MAPPING,
  selectDropdownOption,
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
  uniqueName: "material-sample-list"
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
  const mockSave = jest.fn();
  const mockAxiosPatch = jest.fn();
  const mockAxiosPost = jest.fn();
  const mockAxiosDelete = jest.fn();

  const testCtx = {
    apiContext: {
      apiClient: {
        get: mockGet,
        axios: {
          post: mockAxiosPost,
          get: mockGet,
          delete: mockAxiosDelete,
          patch: mockAxiosPatch
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
      uniqueName: "material-sample-list"
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
        await selectDropdownOption(
          wrapper,
          /select export template/i,
          "Material Sample Demo"
        );

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
        expect(wrapper.getByText("Tab")).toBeInTheDocument();

        // Submit the export to ensure the network request is setup properly.
        await userEvent.click(wrapper.getByRole("button", { name: "Export" }));
        expect(mockSave.mock.calls).toEqual([
          [
            [
              {
                resource: {
                  exportOptions: {
                    columnSeparator: "TAB"
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

      it("Create a new export using the template", async () => {
        mockAxiosPost.mockResolvedValue({
          data: {
            data: {
              id: "new-template-id",
              type: "data-export-template",
              attributes: {
                name: "My New Template",
                group: "aafc",
                restrictToCreatedBy: true,
                publiclyReleasable: false,
                exportType: "TABULAR_DATA",
                exportOptions: { columnSeparator: "COMMA" },
                schema: {
                  "material-sample": {
                    columns: ["materialSampleName"],
                    aliases: ["Primary ID"]
                  }
                }
              }
            }
          }
        });

        const wrapper = mountWithAppContext(<ExportPage />, testCtx);
        await waitForLoadingToDisappear();

        // Open the "Save Export Template" modal via the footer button
        await userEvent.click(
          wrapper.getByRole("button", { name: /save export template/i })
        );

        // The modal should appear
        await waitFor(() => {
          expect(wrapper.getByRole("dialog")).toBeInTheDocument();
        });

        // Type in the template name
        const nameInput = wrapper
          .getByRole("dialog")
          .querySelector("input") as HTMLInputElement;
        await userEvent.type(nameInput, "My New Template");

        // Click "Create"
        await userEvent.click(wrapper.getByRole("button", { name: /create/i }));

        await waitFor(() => {
          expect(mockAxiosPost).toHaveBeenCalledWith(
            "/dina-export-api/data-export-template",
            {
              data: {
                attributes: {
                  exportOptions: {
                    columnSeparator: "COMMA"
                  },
                  exportType: "TABULAR_DATA",
                  group: "aafc",
                  name: "My New Template",
                  publiclyReleasable: false,
                  restrictToCreatedBy: true,
                  schema: {
                    "material-sample": {
                      columns: [],
                      aliases: []
                    }
                  }
                },
                type: "data-export-template"
              }
            },
            expect.any(Object)
          );
        });
      });

      it("Delete existing export template", async () => {
        mockAxiosDelete.mockResolvedValue({});

        const wrapper = mountWithAppContext(<ExportPage />, testCtx);
        await waitForLoadingToDisappear();

        // Select an existing template
        await selectDropdownOption(
          wrapper,
          /select export template/i,
          "Material Sample Demo"
        );
        await waitForLoadingToDisappear();

        // The delete button (trash icon, styled as btn-danger) should now be visible
        const deleteButtons =
          wrapper.container.querySelectorAll("button.btn-danger");
        expect(deleteButtons.length).toBeGreaterThan(0);
        await userEvent.click(deleteButtons[0]);

        await waitFor(() => {
          expect(mockAxiosDelete).toHaveBeenCalledWith(
            `/dina-export-api/data-export-template/${MOCK_TEMPLATES[0].id}`
          );
        });
      });

      it("Update existing export template after changing columns", async () => {
        mockAxiosPatch.mockResolvedValue({
          data: {
            data: {
              id: MOCK_TEMPLATES[0].id,
              type: "data-export-template",
              attributes: {
                ...MOCK_TEMPLATES[0],
                schema: {
                  "material-sample": {
                    columns: ["collection.name", "createdBy"],
                    aliases: ["alias2", "alias3"]
                  }
                }
              }
            }
          }
        });

        const wrapper = mountWithAppContext(<ExportPage />, testCtx);
        await waitForLoadingToDisappear();

        // Select an existing template to load columns
        await selectDropdownOption(
          wrapper,
          /select export template/i,
          "Material Sample Demo"
        );
        await waitForLoadingToDisappear();

        // Verify the "Save Changes" button is not visible yet
        expect(wrapper.queryByText(/save changes/i)).not.toBeInTheDocument();

        // Change one of the aliases:
        await userEvent.type(
          wrapper.getByPlaceholderText(/createdby/i),
          "-updated"
        );

        // "Save Changes" button should now be visible
        await waitFor(() => {
          expect(wrapper.getByText(/save changes/i)).toBeInTheDocument();
        });

        // Click "Save Changes"
        await userEvent.click(wrapper.getByText(/save changes/i));

        // Verify the correct PATCH request is made
        await waitFor(() => {
          expect(mockAxiosPatch).toHaveBeenCalledWith(
            `/dina-export-api/data-export-template/${MOCK_TEMPLATES[0].id}`,
            {
              data: {
                attributes: {
                  exportOptions: {
                    columnSeparator: "TAB"
                  },
                  exportType: "TABULAR_DATA",
                  functions: undefined,
                  name: "Material Sample Demo",
                  publiclyReleasable: false,
                  restrictToCreatedBy: true,
                  schema: {
                    "material-sample": {
                      aliases: ["alias1", "alias2", "alias3-updated"],
                      columns: [
                        "materialSampleName",
                        "collection.name",
                        "createdBy"
                      ]
                    }
                  }
                },
                id: "f3245214-301d-437d-ae36-64cdc39665ea",
                type: "data-export-template"
              }
            },
            expect.any(Object)
          );
        });
      });

      it("Shows Save Changes after changing the separator", async () => {
        const wrapper = mountWithAppContext(<ExportPage />, testCtx);
        await waitForLoadingToDisappear();

        await selectDropdownOption(
          wrapper,
          /select export template/i,
          "Material Sample Demo"
        );
        await waitForLoadingToDisappear();

        expect(wrapper.queryByText(/save changes/i)).not.toBeInTheDocument();

        const separatorSelect = wrapper.getAllByRole("combobox")[0];
        await userEvent.click(separatorSelect);
        await userEvent.click(await wrapper.findByText(/^Comma$/));

        expect(wrapper.getByText(/save changes/i)).toBeInTheDocument();
      });
    });

    it("Changing the export name updates the data export request properly", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // Change the name
      await userEvent.type(
        wrapper.getByRole("textbox", { name: /export name/i }),
        "my-export-1"
      );

      // Submit export
      const submitButton = wrapper.getByRole("button", { name: "Export" });
      await userEvent.click(submitButton);

      // Verify payload has updated name
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          [
            {
              resource: {
                exportOptions: expect.anything(),
                functions: undefined,
                name: "my-export-1",
                query: '{"query":{"match_all":{}}}',
                schema: {
                  "material-sample": {
                    aliases: [],
                    columns: []
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

    it("Changing the separator dropdown updates the data export request properly", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // Find the separator dropdown using the container approach
      await selectDropdownOption(wrapper, /separator/i, "Tab");

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
                name: undefined,
                query: '{"query":{"match_all":{}}}',
                schema: {
                  "material-sample": {
                    aliases: [],
                    columns: []
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

    it("After a successful export, the Export button is disabled", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      const exportButton = wrapper.getByRole("button", { name: "Export" });
      expect(exportButton).not.toBeDisabled();

      // Submit export
      await userEvent.click(exportButton);

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });

      // The export button should be disabled after submission
      await waitFor(() => {
        expect(wrapper.getByRole("button", { name: "Export" })).toBeDisabled();
      });
    });

    it("Handles column selection properly and updates the export configuration", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // Load a template so we have some columns
      await selectDropdownOption(
        wrapper,
        /select export template/i,
        "Material Sample Demo"
      );
      await waitForLoadingToDisappear();

      // Verify columns are loaded
      expect(wrapper.getByText("Primary ID")).toBeInTheDocument();
      expect(wrapper.getByText("Name")).toBeInTheDocument();
      expect(wrapper.getByText("Created By")).toBeInTheDocument();

      // Verify aliases are editable and update one
      const alias1Input = wrapper.getByDisplayValue("alias1");
      await userEvent.clear(alias1Input);
      await userEvent.type(alias1Input, "new-alias-1");

      // Submit export and verify the updated alias is sent in the payload
      await userEvent.click(wrapper.getByRole("button", { name: "Export" }));

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          [
            {
              resource: expect.objectContaining({
                schema: {
                  "material-sample": expect.objectContaining({
                    aliases: expect.arrayContaining(["new-alias-1"])
                  })
                }
              }),
              type: "data-export"
            }
          ],
          { apiBaseUrl: "/dina-export-api" }
        );
      });
    });
  });

  describe("Object Export", () => {
    beforeEach(() => {
      // Set up router for Object Store Export
      mockQuery = {
        entityLink: "/object-store/object",
        indexName: "dina_object_store_index",
        uniqueName: "object-store-list"
      };

      // Set up sessionStorage with selected object store ids and total records count
      window.sessionStorage.setItem(DATA_EXPORT_TOTAL_RECORDS_KEY, "2");
      window.sessionStorage.setItem(
        OBJECT_EXPORT_IDS_KEY,
        JSON.stringify(["obj-1", "obj-2"])
      );
    });

    it("Basic object export request testing with name change", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // Switch into "Object" mode.
      await userEvent.click(wrapper.getByText(/objects/i));
      await waitForLoadingToDisappear();

      // Change the name:
      await userEvent.type(
        wrapper.getByRole("textbox", { name: /export name/i }),
        "object-export-1"
      );

      // Submit the export.
      await userEvent.click(wrapper.getByRole("button", { name: /export/i }));

      // Expect the correct network request.
      expect(mockSave).toHaveBeenCalledWith(
        [
          {
            resource: {
              fileIdentifiers: [
                "file-obj-1?include=derivatives",
                "file-obj-2?include=derivatives"
              ],
              name: "object-export-1",
              type: "object-export"
            },
            type: "object-export"
          }
        ],
        {
          apiBaseUrl: "/objectstore-api"
        }
      );
    });

    it("renders and handles File Name Alias Field selection properly", async () => {
      // Override mockBulkGet with metadata that has an originalFilename
      mockBulkGet.mockImplementation(async (paths: string[]) => {
        if (paths[0]?.includes("metadata/")) {
          return paths.map((path: string) => {
            const id = path.split("/").pop();
            return {
              id,
              type: "metadata",
              fileIdentifier: `file-${id}`,
              dcType: "IMAGE",
              fileExtension: ".jpg",
              originalFilename: `original-${id}.jpg`
            };
          });
        }
        return [];
      });

      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // Switch into "Object" mode.
      await userEvent.click(wrapper.getByText(/objects/i));
      await waitForLoadingToDisappear();

      // The "File Name Alias Field" section should be visible
      expect(wrapper.getByText(/file name alias field/i)).toBeInTheDocument();

      // Select "originalFilename" as the alias field.
      // The field label in the dropdown is the intl message "field_originalFilename" = "Original Filename"
      const aliasFieldSelect = wrapper.getAllByRole("combobox")[0];
      await userEvent.click(aliasFieldSelect);
      await userEvent.click(await wrapper.findByText(/original filename/i));

      // Submit the export
      await userEvent.click(wrapper.getByRole("button", { name: /export/i }));

      // The save call should include filenameAliases
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          [
            {
              resource: expect.objectContaining({
                type: "object-export",
                filenameAliases: expect.any(Object)
              }),
              type: "object-export"
            }
          ],
          { apiBaseUrl: "/objectstore-api" }
        );
      });
    });

    it("renders and handles Resize Image options correctly in the submission payload", async () => {
      // Override mockBulkGet with JPEG-only metadata so resize becomes enabled
      mockBulkGet.mockImplementation(async (paths: string[]) => {
        if (paths[0]?.includes("metadata/")) {
          return paths.map((path: string) => {
            const id = path.split("/").pop();
            return {
              id,
              type: "metadata",
              fileIdentifier: `file-${id}`,
              dcType: "IMAGE",
              fileExtension: ".jpg",
              dcFormat: "image/jpeg",
              derivatives: []
            };
          });
        }
        return [];
      });

      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // Switch into "Object" mode.
      await userEvent.click(wrapper.getByText(/objects/i));
      await waitForLoadingToDisappear();

      // Wait for the JPEG eligibility check (bulkGet) to complete
      await waitFor(() => {
        expect(mockBulkGet).toHaveBeenCalled();
      });

      // The resize Select should now be enabled (all objects are JPEG).
      // Select resize to 50%
      const resizeSelect = wrapper.getAllByRole("combobox")[1];
      await userEvent.click(resizeSelect);
      await userEvent.click(await wrapper.findByText(/^50%/));

      // Submit the export
      await userEvent.click(wrapper.getByRole("button", { name: /export/i }));

      // The save call should include the IMG_RESIZE exportFunction
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          [
            {
              resource: expect.objectContaining({
                type: "object-export",
                exportFunction: {
                  functionDef: "IMG_RESIZE",
                  params: { factor: "0.5" }
                }
              }),
              type: "object-export"
            }
          ],
          { apiBaseUrl: "/objectstore-api" }
        );
      });
    });

    it("Resize option is disabled when objects are not all JPEG", async () => {
      // Override mockBulkGet with non-JPEG metadata (PNG)
      mockBulkGet.mockImplementation(async (paths: string[]) => {
        if (paths[0]?.includes("metadata/")) {
          return paths.map((path: string) => {
            const id = path.split("/").pop();
            return {
              id,
              type: "metadata",
              fileIdentifier: `file-${id}`,
              dcType: "IMAGE",
              fileExtension: ".png",
              derivatives: []
            };
          });
        }
        return [];
      });

      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // Switch into "Object" mode.
      await userEvent.click(wrapper.getByText(/objects/i));
      await waitForLoadingToDisappear();

      // Wait for JPEG check to complete
      await waitFor(() => {
        expect(mockBulkGet).toHaveBeenCalled();
      });

      // When not all objects are JPEG, the resize react-select is disabled.
      await waitFor(() => {
        expect(
          wrapper.container.querySelectorAll("input:disabled").length
        ).toBeGreaterThan(0);
      });
    });

    it("Shows the Data/Objects export type toggle only for object-store-list", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // Both the "Data" and "Objects" toggle buttons should be visible
      expect(wrapper.getByText(/^data$/i)).toBeInTheDocument();
      expect(wrapper.getByText(/objects/i)).toBeInTheDocument();
    });

    it("Switching between Data and Objects tabs shows/hides the correct UI sections", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // Default is TABULAR_DATA — separator dropdown visible
      expect(wrapper.getByText(/separator/i)).toBeInTheDocument();

      // Switch to Objects — separator should be hidden, resize/alias controls appear
      await userEvent.click(wrapper.getByText(/objects/i));
      await waitForLoadingToDisappear();

      expect(wrapper.queryByText(/^separator$/i)).not.toBeInTheDocument();
      expect(wrapper.getByText(/resize images/i)).toBeInTheDocument();
      expect(wrapper.getByText(/file name alias field/i)).toBeInTheDocument();

      // Switch back to Data — separator returns, resize/alias sections hidden
      await userEvent.click(wrapper.getByText(/^data$/i));
      await waitForLoadingToDisappear();

      expect(wrapper.getByText(/separator/i)).toBeInTheDocument();
      expect(wrapper.queryByText(/resize images/i)).not.toBeInTheDocument();
    });
  });

  describe("Material Sample Export (non-object-store)", () => {
    beforeEach(() => {
      // Keep material-sample query config
      mockQuery = {
        entityLink: "/collection/material-sample",
        indexName: "dina_material_sample_index",
        uniqueName: "material-sample-list"
      };
      window.sessionStorage.setItem(DATA_EXPORT_TOTAL_RECORDS_KEY, "3");
      window.localStorage.setItem(
        DATA_EXPORT_QUERY_KEY,
        JSON.stringify({ query: { match_all: {} } })
      );
    });

    it("Does not show the Data/Objects export toggle for non-object-store lists", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // The toggle should NOT be present for material-sample-list
      expect(wrapper.queryByText(/^objects$/i)).not.toBeInTheDocument();
    });

    it("Shows the Columns to Export section in TABULAR_DATA mode", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // Column selector section should be visible in the default TABULAR_DATA mode
      expect(wrapper.getByText(/columns to export/i)).toBeInTheDocument();
    });

    it("Shows the molecular analysis export link button", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // The molecular analysis export button should exist in the button bar
      expect(
        wrapper.getByText(/molecular analysis export/i)
      ).toBeInTheDocument();
    });

    it("Shows the export history button", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      expect(wrapper.getByText(/view export history/i)).toBeInTheDocument();
    });

    it("Submits a tabular data export with correct schema and source for material-sample index", async () => {
      window.localStorage.setItem(
        DATA_EXPORT_QUERY_KEY,
        JSON.stringify({ query: { term: { type: "material-sample" } } })
      );

      const wrapper = mountWithAppContext(<ExportPage />, testCtx);
      await waitForLoadingToDisappear();

      // Submit without any columns selected
      await userEvent.click(wrapper.getByRole("button", { name: "Export" }));

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          [
            {
              resource: expect.objectContaining({
                source: "dina_material_sample_index",
                type: "data-export",
                query: expect.stringContaining("material-sample")
              }),
              type: "data-export"
            }
          ],
          { apiBaseUrl: "/dina-export-api" }
        );
      });
    });
  });
});
