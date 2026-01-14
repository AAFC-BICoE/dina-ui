import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";
import {
  DATA_EXPORT_QUERY_KEY,
  DATA_EXPORT_TOTAL_RECORDS_KEY
} from "common-ui";
import ExportMolecularAnalysisPage from "../../../../pages/export/molecular-analysis-export/export";
import userEvent from "@testing-library/user-event";
import { MolecularAnalysisRunItemUsageType } from "../../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";

const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    query: { entityLink: "/collection/material-sample" }
  })
}));

// Metadata Mocks:
const TEST_METADATA_ID_1 = "metadata-1";
const TEST_METADATA_ID_2 = "metadata-2";
const TEST_METADATA_ID_3 = "metadata-3";
const TEST_FILE_IDENTIFIER_1 = "file-identifier-1";
const TEST_FILE_IDENTIFIER_2 = "file-identifier-2";
const TEST_FILE_IDENTIFIER_3 = "file-identifier-3";

const TEST_METADATA_1 = {
  id: TEST_METADATA_ID_1,
  type: "metadata",
  fileIdentifier: TEST_FILE_IDENTIFIER_1,
  dcType: "IMAGE"
};

const TEST_METADATA_2 = {
  id: TEST_METADATA_ID_2,
  type: "metadata",
  fileIdentifier: TEST_FILE_IDENTIFIER_2,
  dcType: "IMAGE"
};

const TEST_METADATA_3 = {
  id: TEST_METADATA_ID_3,
  type: "metadata",
  fileIdentifier: TEST_FILE_IDENTIFIER_3,
  dcType: "IMAGE"
};

const TEST_RUN_ID = "molecular-analysis-run-1";
const TEST_RESULT_UUID = "result-uuid-1";

// Elastic Search Response
const TEST_ES_RESPONSE = {
  hits: {
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
  }
};

// API Responses
const TEST_RUN_RESPONSE = {
  id: TEST_RUN_ID,
  type: "molecular-analysis-run",
  attachments: [
    {
      id: TEST_METADATA_ID_1,
      type: "metadata"
    }
  ]
};

const TEST_RESULT_RESPONSE = {
  id: TEST_RESULT_UUID,
  type: "molecular-analysis-result",
  attachments: [
    {
      id: TEST_METADATA_ID_2,
      type: "metadata"
    }
  ]
};

// Quality Control Data:
const TEST_QC_ITEM_ID = "qc-item-1";
const TEST_QC_RESULT_UUID = "qc-result-1";

const TEST_QC_ITEMS_RESPONSE = [
  {
    id: TEST_QC_ITEM_ID,
    type: "molecular-analysis-run-item",
    usageType: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL,
    run: { id: TEST_RUN_ID },
    result: { id: TEST_QC_RESULT_UUID }
  }
];

const TEST_QC_RESULT_RESPONSE = [
  {
    id: TEST_QC_RESULT_UUID,
    type: "molecular-analysis-result",
    attachments: [
      {
        id: TEST_METADATA_ID_3,
        type: "metadata"
      }
    ]
  }
];

const TEST_QC_DEFINITION_RESPONSE = [
  {
    molecularAnalysisRunItem: { id: TEST_QC_ITEM_ID },
    name: "Positive Control"
  }
];

const mockGet = jest.fn<any, any>(async (path) => {
  // Molecular Analysis Run Item (for QC)
  if (path === "seqdb-api/molecular-analysis-run-item") {
    return { data: TEST_QC_ITEMS_RESPONSE };
  }

  // Molecular Analysis Run Result
  if (path === "seqdb-api/molecular-analysis-result") {
    return { data: TEST_QC_RESULT_RESPONSE };
  }

  // Quality Control Name
  if (path === "seqdb-api/quality-control") {
    return { data: TEST_QC_DEFINITION_RESPONSE };
  }
  return { data: [] };
});

const mockBulkGet = jest.fn<any, any>(async (paths) => {
  if (!paths.length) return [];

  // Metadata
  if (paths[0].includes("metadata/")) {
    return paths
      .map((path) => {
        if (path.includes(TEST_METADATA_ID_1)) return TEST_METADATA_1;
        if (path.includes(TEST_METADATA_ID_2)) return TEST_METADATA_2;
        if (path.includes(TEST_METADATA_ID_3)) return TEST_METADATA_3;
        return null;
      })
      .filter(Boolean);
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
  if (path === "search-api/search-ws/search") {
    return { data: TEST_ES_RESPONSE };
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
        post: mockPost,
        get: mockGet
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

    // Check Run Name
    await waitFor(() =>
      expect(wrapper.getByText("Test Run 1")).toBeInTheDocument()
    );

    // Check Run Item Name
    expect(wrapper.getByText("Sample 1")).toBeInTheDocument();

    // Check Attachment badges
    await waitFor(() => {
      const badges = wrapper.getAllByText(/1 attachments/i);
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });

    // Ensure the total is 2.
    expect(wrapper.getByText(/2/i)).toBeInTheDocument();
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

    // Initial loading spinner
    await waitForLoadingToDisappear();

    // Check Run Name
    await waitFor(() =>
      expect(wrapper.getByText("Test Run 1")).toBeInTheDocument()
    );

    // Check Attachment badges
    await waitFor(() => {
      const badges = wrapper.getAllByText(/1 attachments/i);
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });

    // Deselect all button:
    userEvent.click(wrapper.getByRole("button", { name: /deselect all/i }));
    await waitForLoadingToDisappear();

    // Total attachments should be 0 now
    expect(wrapper.getByText("0")).toBeInTheDocument();

    // Select one of the runs only.
    userEvent.click(wrapper.getByTestId("runSelected[0]"));

    // Total attachments should be 1 now
    await waitFor(() => expect(wrapper.getByText("1")).toBeInTheDocument());
  });

  it("Performs an export when the form is submitted", async () => {
    const wrapper = mountWithAppContext(
      <ExportMolecularAnalysisPage />,
      testCtx
    );

    // Initial loading spinner
    await waitForLoadingToDisappear();

    // Check Run Name
    await waitFor(() =>
      expect(wrapper.getByText("Test Run 1")).toBeInTheDocument()
    );

    // Check Attachment badges
    await waitFor(() => {
      const badges = wrapper.getAllByText(/1 attachments/i);
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });

    // Fill in Export Name
    userEvent.type(
      wrapper.getByRole("textbox", { name: /export name/i }),
      "Test Export"
    );

    // Click Export Button
    userEvent.click(wrapper.getByRole("button", { name: /export/i }));

    // Wait for save to be called
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    // Ensure request is correct.
    expect(mockSave).toHaveBeenCalledWith(
      [
        {
          resource: {
            exportLayout: {
              "Test Run 1/": ["file-identifier-1"],
              "Test Run 1/results": ["file-identifier-2"]
            },
            fileIdentifiers: ["file-identifier-1", "file-identifier-2"],
            name: "Test Export",
            type: "object-export"
          },
          type: "object-export"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );

    // Verify it attempts to download it.
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith(
        "dina-export-api/data-export/export-job-1",
        {}
      )
    );
  });

  it("Fetches and includes Quality Controls when toggle is enabled", async () => {
    const wrapper = mountWithAppContext(
      <ExportMolecularAnalysisPage />,
      testCtx
    );

    // Initial loading spinner
    await waitForLoadingToDisappear();

    // Check Run Name
    await waitFor(() =>
      expect(wrapper.getByText("Test Run 1")).toBeInTheDocument()
    );

    // Check Attachment badges
    await waitFor(() => {
      const badges = wrapper.getAllByText(/1 attachments/i);
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });

    // Enable Quality Control toggle
    userEvent.click(wrapper.getByTestId("includeQualityControls"));

    // Wait for the quality control attachments to be loaded.
    await waitFor(() => {
      const badges = wrapper.getAllByText(/1 attachments/i);
      expect(badges.length).toBeGreaterThanOrEqual(3);
    });

    // Click Export Button
    userEvent.click(wrapper.getByRole("button", { name: /export/i }));

    // Wait for save to be called
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    // Ensure request is correct.
    expect(mockSave).toHaveBeenCalledWith(
      [
        {
          resource: {
            exportLayout: {
              "Test Run 1/": ["file-identifier-1"],
              "Test Run 1/controls": ["file-identifier-3"],
              "Test Run 1/results": ["file-identifier-2"]
            },
            fileIdentifiers: [
              "file-identifier-1",
              "file-identifier-2",
              "file-identifier-3"
            ],
            name: undefined, // No name provided in this test.
            type: "object-export"
          },
          type: "object-export"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );

    // Verify it attempts to download it.
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith(
        "dina-export-api/data-export/export-job-1",
        {}
      )
    );
  });
});
