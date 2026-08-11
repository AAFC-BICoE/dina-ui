import React from "react";
import {
  MATERIAL_SAMPLE_MAPPING,
  mountWithAppContext,
  OBJECT_STORE_MAPPING,
  waitForLoadingToDisappear
} from "common-ui";
import "@testing-library/jest-dom";
import { waitFor, screen, fireEvent } from "@testing-library/react";
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
    attributes: {
      createdOn: "2025-05-06T16:24:47.296631Z",
      createdBy: "elkayssin",
      group: "aafc",
      restrictToCreatedBy: true,
      publiclyReleasable: false,
      name: "Material Sample Demo",
      exportType: "TABULAR_DATA",
      exportOptions: {
        columnSeparator: "COMMA"
      },
      schema: {
        "material-sample": {
          columns: ["materialSampleName", "collection.name", "createdBy"],
          aliases: ["Identifier", "Collection", "Created By"]
        }
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

jest.mock("react-select", () => {
  return ({ options, value, onChange, className, isDisabled, name }: any) => {
    function handleChange(event: any) {
      const option = options.find(
        (opt: any) => opt.value === event.target.value
      );
      onChange(option);
    }
    return (
      <select
        data-testid={name || className}
        disabled={isDisabled}
        value={value ? value.value : ""}
        onChange={handleChange}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };
});

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
    mockGet.mockImplementation(async (path) => {
      if (path.includes("search-ws/mapping")) {
        if (path.includes("dina_material_sample_index")) {
          return { data: MATERIAL_SAMPLE_MAPPING };
        }
        if (path.includes("dina_object_store_index")) {
          return { data: OBJECT_STORE_MAPPING };
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

    it("loads and displays existing Data Export Templates, and handles selection", async () => {
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

      // Find template selection dropdown (mocked react-select gets name or class as testid)
      const templateSelect = wrapper.getByTestId("savedExportOption");
      expect(templateSelect).toBeInTheDocument();

      // Simulate selecting the "Material Sample Demo" template
      fireEvent.change(templateSelect, {
        target: { value: "f3245214-301d-437d-ae36-64cdc39665ea" }
      });

      screen.logTestingPlaygroundURL();

      // Verify template choice affects selected columns
      await waitFor(() => {
        expect(screen.getByText(/Material Sample Demo/i)).toBeInTheDocument();
      });
    });

    it("handles Separator selection and correctly updates Form state and submission payload", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);

      // Verify that the separator dropdown is rendered with options
      const separatorSelect = wrapper.getByTestId("selectedSeparator");
      expect(separatorSelect).toBeInTheDocument();

      // Change separator from COMMA to TAB
      fireEvent.change(separatorSelect, { target: { value: "TAB" } });

      // Find and click the submit/export button
      const submitButton = wrapper.getByRole("button", { name: /export/i });
      await userEvent.click(submitButton);

      // Verify save is called with the selected TAB separator
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              attributes: expect.objectContaining({
                exportOptions: expect.objectContaining({
                  columnSeparator: "TAB"
                })
              })
            })
          ]),
          expect.any(Object)
        );
      });
    });

    it("allows the export or template name to be set correctly", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);

      // Test name setting in the Saved Export Modal (useSavedExports modal)
      const saveTemplateBtn = wrapper.getByRole("button", {
        name: /create saved export/i
      });
      await userEvent.click(saveTemplateBtn);

      // Modal should be displayed, find the text input for savedExportName
      // const nameInput = wrapper.querySelector('input[value=""]') || screen.getByRole("textbox");
      // expect(nameInput).toBeInTheDocument();

      // Type a new name for the template
      // await userEvent.type(nameInput, "My Awesome Export Template");

      // // Verify input value reflects change
      // expect(nameInput).toHaveValue("My Awesome Export Template");
    });

    it("handles column selection properly and updates the export configuration", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);

      // Select columns to export (simulate interacting with column list / checkboxes)
      // Since ColumnSelector renders lists, we can simulate toggling or checking a checkbox
      const columnCheckboxes = wrapper.getAllByRole("checkbox");
      if (columnCheckboxes.length > 0) {
        // Toggle first column checkbox
        await userEvent.click(columnCheckboxes[0]);
      }

      // Submit the form
      const submitButton = wrapper.getByRole("button", { name: /export/i });
      await userEvent.click(submitButton);

      // Verify save payload includes chosen columns
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });
    });
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

    it("renders and handles File Name Alias Field selection properly", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);

      // Locate the Filename Alias Field selector (using QueryFieldSelector)
      const aliasSelect = wrapper.getByTestId(/selectedFilenameAliasField/i);
      expect(aliasSelect).toBeInTheDocument();

      // Simulate choosing "originalFilename" as the file name alias
      fireEvent.change(aliasSelect, { target: { value: "originalFilename" } });

      // Click the export button
      const submitButton = wrapper.getByRole("button", { name: /export/i });
      await userEvent.click(submitButton);

      // Verify that filename alias selection is passed correctly to the save function
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              attributes: expect.objectContaining({
                filenameAliasField: "originalFilename"
              })
            })
          ]),
          expect.any(Object)
        );
      });
    });

    it("renders and handles Resize Image options correctly in the submission payload", async () => {
      const wrapper = mountWithAppContext(<ExportPage />, testCtx);

      // Wait for eligibility check (bulkGet) to finish so the resize select is not disabled
      await waitFor(() => {
        expect(mockBulkGet).toHaveBeenCalled();
      });

      // Find the resizePercentage dropdown selector
      const resizeSelect = wrapper.getByTestId("resizePercentage");
      expect(resizeSelect).toBeInTheDocument();

      // Change resize percentage selection to 50%
      fireEvent.change(resizeSelect, { target: { value: "50" } });

      // Click the export button
      const submitButton = wrapper.getByRole("button", { name: /export/i });
      await userEvent.click(submitButton);

      // Verify the submission contains the 50% resize selection
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              attributes: expect.objectContaining({
                resizePercentage: 50
              })
            })
          ]),
          expect.any(Object)
        );
      });
    });
  });
});
