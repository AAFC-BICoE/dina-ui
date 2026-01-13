import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import {
  DATA_EXPORT_QUERY_KEY,
  DATA_EXPORT_TOTAL_RECORDS_KEY
} from "common-ui";
import ExportMolecularAnalysisPage from "../../../../pages/export/molecular-analysis-export/export";

const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    query: { entityLink: "/collection/material-sample" }
  })
}));

const TEST_METADATA_ID = "1c356163-4b08-4663-b1d5-949cb2db2766";
const TEST_FILE_IDENTIFIER = "file-abc-123";

const TEST_RUN_ID = "30e01768-3011-477c-a447-79883f069d3f";
// const TEST_RUN_ITEM_ID = "6c5e533b-8287-4009-8806-b32814838e5d";
const TEST_RESULT_UUID = "result-uuid-1";

const TEST_METADATA = {
  id: TEST_METADATA_ID,
  type: "metadata",
  fileIdentifier: TEST_FILE_IDENTIFIER,
  dcType: "IMAGE"
};

const TEST_RUN_ATTACHMENT_RESOURCE = {
  id: TEST_METADATA_ID,
  type: "metadata"
};

// Elastic Search Response (simulating the query result)
const TEST_ES_RESPONSE = {
  hits: [
    {
      _source: {
        included: [
          {
            id: TEST_RUN_ID,
            type: "run-summary",
            attributes: {
              name: "Test Run 1",
              items: [
                {
                  result: { uuid: TEST_RESULT_UUID },
                  genericMolecularAnalysisItemSummary: { name: "Sample 1" }
                }
              ]
            }
          }
        ]
      }
    }
  ]
};

// API Responses
const TEST_RUN_RESPONSE = {
  id: TEST_RUN_ID,
  type: "molecular-analysis-run",
  attachments: [TEST_RUN_ATTACHMENT_RESOURCE]
};

const TEST_RESULT_RESPONSE = {
  id: TEST_RESULT_UUID,
  type: "molecular-analysis-result",
  attachments: [TEST_RUN_ATTACHMENT_RESOURCE]
};

// QC Data
const TEST_QC_ITEM_ID = "qc-item-1";
const TEST_QC_RESULT_UUID = "qc-result-1";

const TEST_QC_ITEMS_RESPONSE = [
  {
    id: TEST_QC_ITEM_ID,
    type: "molecular-analysis-run-item",
    usageType: "QUALITY_CONTROL",
    run: { id: TEST_RUN_ID },
    result: { id: TEST_QC_RESULT_UUID }
  }
];

const TEST_QC_RESULT_RESPONSE = [
  {
    id: TEST_QC_RESULT_UUID,
    type: "molecular-analysis-result",
    attachments: [TEST_RUN_ATTACHMENT_RESOURCE]
  }
];

const TEST_QC_DEFINITION_RESPONSE = [
  {
    molecularAnalysisRunItem: { id: TEST_QC_ITEM_ID },
    name: "Positive Control"
  }
];

const mockGet = jest.fn<any, any>(async (path) => {
  // console.log("Mock GET called with path:", path);

  if (path === "seqdb-api/molecular-analysis-run-item") {
    return { data: TEST_QC_ITEMS_RESPONSE };
  }
  if (path === "seqdb-api/molecular-analysis-result") {
    return { data: TEST_QC_RESULT_RESPONSE };
  }
  if (path === "seqdb-api/quality-control") {
    return { data: TEST_QC_DEFINITION_RESPONSE };
  }
  return { data: [] };
});

const mockBulkGet = jest.fn<any, any>(async (paths) => {
  // console.log("Mock Bulk GET called with paths:", paths);

  if (!paths.length) return [];

  // Metadata
  if (paths[0].includes("metadata/")) {
    return [TEST_METADATA];
  }

  // Run Attachments
  if (paths[0].includes("molecular-analysis-run/")) {
    return [TEST_RUN_RESPONSE];
  }

  // Result Attachments
  if (paths[0].includes("molecular-analysis-result/")) {
    return [TEST_RESULT_RESPONSE];
  }

  return [];
});

const mockPost = jest.fn<any, any>(async (path) => {
  // console.log("Mock POST called with path:", path);

  if (path === "search-api/search-ws/search") {
    return TEST_ES_RESPONSE;
  }

  return { data: {} };
});

const mockSave = jest.fn<any, any>(async (_ops) => {
  return [
    {
      id: "export-job-1",
      type: "object-export"
    }
  ];
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      axios: {
        post: mockPost
      }
    },
    bulkGet: mockBulkGet,
    save: mockSave
  }
} as any;

// Storage Mocks
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

const sessionStorageMock = (function () {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock
});
Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock
});

describe("ExportMolecularAnalysisPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();

    // Setup Storage State required for the page to load
    window.sessionStorage.setItem(DATA_EXPORT_TOTAL_RECORDS_KEY, "5");
    window.localStorage.setItem(
      DATA_EXPORT_QUERY_KEY,
      JSON.stringify({ query: "test" })
    );
  });

  it("Loads the page and renders run summaries from ElasticSearch", async () => {
    const wrapper = mountWithAppContext(
      <ExportMolecularAnalysisPage />,
      testCtx
    );

    // Initial loading spinner
    await waitForLoadingToDisappear();

    screen.logTestingPlaygroundURL();

    // Check Run Name
    expect(wrapper.getByText("Test Run 1")).toBeInTheDocument();

    // Check Run Item Name
    expect(wrapper.getByText("Sample 1")).toBeInTheDocument();

    // Check Attachment badges (1 for run, 1 for item)
    // The component displays "Attachments: 1" in a badge
    const badges = wrapper.getAllByText(/attachments: 1/i);
    expect(badges.length).toBeGreaterThanOrEqual(2);

    // Check Total Attachments calculation at bottom
    expect(wrapper.getByText(/total attachments/i)).toBeInTheDocument();
  });

  it("Redirects if no records are found in storage", async () => {
    window.sessionStorage.setItem(DATA_EXPORT_TOTAL_RECORDS_KEY, "0");
    mountWithAppContext(<ExportMolecularAnalysisPage />, testCtx);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/export/data-export/list");
    });
  });

  it("Allows selecting and deselecting runs and items", async () => {
    const wrapper = mountWithAppContext(
      <ExportMolecularAnalysisPage />,
      testCtx
    );

    await waitFor(() => {
      expect(wrapper.queryByRole("status")).not.toBeInTheDocument();
    });

    // Get the checkbox for the Run (first checkbox usually)
    // Note: DinaForm layout, finding specific checkbox might need name attribute targeting
    const runCheckbox = wrapper.container.querySelector(
      "input[name='runSelected[0]']"
    ) as HTMLInputElement;

    expect(runCheckbox).toBeChecked();

    // Deselect Run
    fireEvent.click(runCheckbox);
    expect(runCheckbox).not.toBeChecked();

    // Item checkbox should be disabled if run is disabled
    const itemCheckbox = wrapper.container.querySelector(
      "input[name='runItemSelected[0]']"
    ) as HTMLInputElement;
    expect(itemCheckbox).toBeDisabled();

    // Re-select Run
    fireEvent.click(runCheckbox);
    expect(runCheckbox).toBeChecked();
    expect(itemCheckbox).not.toBeDisabled();

    // Deselect Item specifically
    fireEvent.click(itemCheckbox);
    expect(itemCheckbox).not.toBeChecked();
  });

  it("Performs an export when the form is submitted", async () => {
    const wrapper = mountWithAppContext(
      <ExportMolecularAnalysisPage />,
      testCtx
    );

    await waitFor(() => {
      expect(wrapper.queryByRole("status")).not.toBeInTheDocument();
    });

    // Enter export name
    const nameInput = wrapper.getByRole("textbox", { name: /export name/i });
    fireEvent.change(nameInput, { target: { value: "My Analysis Export" } });

    // Click Export
    const exportButton = wrapper.getByRole("button", {
      name: /export/i
    });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    // Verify Payload
    const saveCallArg = mockSave.mock.calls[0][0][0];
    expect(saveCallArg.resource.name).toBe("My Analysis Export");
    expect(saveCallArg.resource.type).toBe("object-export");

    // Check file identifiers (Run attachment + Item attachment)
    expect(saveCallArg.resource.fileIdentifiers).toContain(
      TEST_FILE_IDENTIFIER
    );
    expect(saveCallArg.resource.fileIdentifiers).toHaveLength(2); // 1 Run Att + 1 Item Att

    // Check directory layout structure
    // Key should be folder path, Value should be array of file identifiers
    const exportLayout = saveCallArg.resource.exportLayout;
    expect(exportLayout["Test Run 1/"]).toBeDefined(); // Run attachments
    expect(exportLayout["Test Run 1/results"]).toBeDefined(); // Item attachments
  });

  it("Fetches and includes Quality Controls when toggle is enabled", async () => {
    const wrapper = mountWithAppContext(
      <ExportMolecularAnalysisPage />,
      testCtx
    );

    await waitFor(() => {
      expect(wrapper.queryByRole("status")).not.toBeInTheDocument();
    });

    // Find QC Toggle
    const qcCheckbox = wrapper.getByRole("checkbox", {
      name: /include quality controls/i
    });

    // Enable QC
    fireEvent.click(qcCheckbox);

    // Expect loading spinner again while QCs fetch
    expect(wrapper.getByRole("status")).toBeInTheDocument();

    await waitFor(() => {
      expect(wrapper.queryByRole("status")).not.toBeInTheDocument();
    });

    // Verify QC Item is now rendered in the list
    expect(wrapper.getByText("Positive Control")).toBeInTheDocument();

    // Verify QC Attachment badge
    // We expect another badge now for the QC item
    const badges = wrapper.getAllByText(/attachments: 1/i);
    expect(badges.length).toBeGreaterThanOrEqual(3);

    // Perform Export with QC included
    const nameInput = wrapper.getByRole("textbox", { name: /export name/i });
    fireEvent.change(nameInput, { target: { value: "Export With QC" } });

    const exportButton = wrapper.getByRole("button", { name: /export/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    const saveCallArg = mockSave.mock.calls[0][0][0];
    const exportLayout = saveCallArg.resource.exportLayout;

    // Check for controls folder
    expect(exportLayout["Test Run 1/controls"]).toBeDefined();
    // Identifiers should now include the QC attachment (mocked as same ID, so set size handles uniqueness check in app logic, but array might have duplicates if mock data reuses IDs)
    // The app logic: if (fileIdentifiers.length !== new Set(fileIdentifiers).size) error...
    // *Important*: The mock data reuses TEST_FILE_IDENTIFIER for Run, Result, and QC.
    // The app actually blocks export if duplicates exist.
    // To test this successfully, the test will likely show the Error Alert instead of calling save if duplicates exist.

    // Let's verify the Error is shown because we reused file IDs in mocks
    expect(wrapper.getByText(/duplicate files detected/i)).toBeInTheDocument();
  });
});
