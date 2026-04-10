import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import {
  MolecularAnalysisResultsStep,
  MolecularAnalysisResultsStepProps
} from "../MolecularAnalysisResultsStep";
import { useState } from "react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/react";
import {
  TEST_MOLECULAR_ANALYSIS,
  TEST_MOLECULAR_ANALYSIS_ITEMS_WITH_RUN,
  TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID,
  TEST_MOLECULAR_ANALYSIS_RUN_ID,
  TEST_MOLECULAR_ANALYSIS_RUN,
  TEST_QUALITY_CONTROL_RUN_ITEMS,
  TEST_QUALITY_CONTROL_1,
  TEST_QUALITY_CONTROL_2,
  TEST_QUALITY_CONTROL_TYPES,
  TEST_METADATA_3,
  STORAGE_UNIT_USAGE_1,
  STORAGE_UNIT_USAGE_2,
  TEST_MATERIAL_SAMPLE_SUMMARY,
  TEST_METADATA_1,
  TEST_MOLECULAR_ANALYSIS_RESULT,
  TEST_METADATA_2,
  TEST_METADATA_4,
  TEST_MOLECULAR_ANALYSIS_ITEMS_WITH_RUN_ITEM_ID
} from "../__mocks__/MolecularAnalysisMocks";
import { MolecularAnalysisRunItemUsageType } from "../../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";

// Mock API responses
const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "/seqdb-api/generic-molecular-analysis-item":
      // Return items associated with the run
      if (params?.filter?.rsql?.includes(TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID)) {
        return { data: TEST_MOLECULAR_ANALYSIS_ITEMS_WITH_RUN };
      }
      return { data: [] };

    case `seqdb-api/molecular-analysis-run/${TEST_MOLECULAR_ANALYSIS_RUN_ID}`:
      return { data: TEST_MOLECULAR_ANALYSIS_RUN };

    case "seqdb-api/molecular-analysis-run-item":
      // Return QC run items
      if (
        params?.filter?.rsql?.includes(
          MolecularAnalysisRunItemUsageType.QUALITY_CONTROL
        ) &&
        params?.filter?.rsql?.includes(TEST_MOLECULAR_ANALYSIS_RUN_ID)
      ) {
        return { data: TEST_QUALITY_CONTROL_RUN_ITEMS };
      }
      return { data: [] };

    case "seqdb-api/quality-control":
      // Return specific QC items based on run item UUID
      if (
        params?.filter?.rsql?.includes(TEST_QUALITY_CONTROL_RUN_ITEMS[0].id)
      ) {
        return { data: TEST_QUALITY_CONTROL_1 };
      }
      if (
        params?.filter?.rsql?.includes(TEST_QUALITY_CONTROL_RUN_ITEMS[1].id)
      ) {
        return { data: TEST_QUALITY_CONTROL_2 };
      }
      return { data: [] };

    case "seqdb-api/vocabulary/qualityControlType":
      return { data: TEST_QUALITY_CONTROL_TYPES };

    // Search for metadata (Auto-select functionality)
    case "objectstore-api/metadata":
      // Mock a successful find for "Provided run item name"
      if (
        params?.filter?.originalFilename?.ILIKE?.includes(
          "Provided run item name"
        )
      ) {
        return { data: [TEST_METADATA_4] };
      }
      // Mock a successful find for "test1" (QC name)
      if (params?.filter?.originalFilename?.ILIKE?.includes("test1")) {
        return { data: [TEST_METADATA_3] };
      }
      return { data: [] };

    // Specific Mock for the Result which contains the attachments
    case `seqdb-api/molecular-analysis-result/${TEST_MOLECULAR_ANALYSIS_RESULT.id}`:
      return { data: TEST_MOLECULAR_ANALYSIS_RESULT };

    case "seqdb-api/molecular-analysis-result":
      return { data: [] };
  }

  // Handle specific ID gets if needed
  if (path.includes("molecular-analysis-result")) {
    return { data: { id: "result-id", attachments: [] } };
  }

  return { data: [] };
});

const mockBulkGet = jest.fn(async (paths) => {
  return paths.map((path: string) => {
    // Storage Unit Usages
    if (path.includes("storage-unit-usage")) {
      if (path.includes(STORAGE_UNIT_USAGE_1.id ?? ""))
        return STORAGE_UNIT_USAGE_1;
      if (path.includes(STORAGE_UNIT_USAGE_2.id ?? ""))
        return STORAGE_UNIT_USAGE_2;
    }

    // Material Samples
    if (path.includes("material-sample-summary")) {
      if (path.includes(TEST_MATERIAL_SAMPLE_SUMMARY[0].id))
        return TEST_MATERIAL_SAMPLE_SUMMARY[0];
      if (path.includes(TEST_MATERIAL_SAMPLE_SUMMARY[1].id))
        return TEST_MATERIAL_SAMPLE_SUMMARY[1];
    }

    // Metadata/Attachments
    if (path.includes("metadata")) {
      if (path.includes(TEST_METADATA_1.id)) return TEST_METADATA_1;
      if (path.includes(TEST_METADATA_2.id)) return TEST_METADATA_2;
      if (path.includes(TEST_METADATA_3.id)) return TEST_METADATA_3;
      if (path.includes(TEST_METADATA_4.id)) return TEST_METADATA_4;
      if (path.includes("deleted-metadata-id")) return null;
      if (path.includes("loading-issue-metadata-id")) return undefined;
    }

    // QC Results (if any exist in the mock data chain)
    if (path.includes("molecular-analysis-result")) {
      return { id: "result-1", attachments: [] };
    }

    return null;
  });
});

const mockSave = jest.fn((ops) =>
  ops.map((op) => ({
    ...op.resource,
    id: op?.resource?.id ?? "saved-id-123"
  }))
);

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      axios: {
        get: mockGet
      }
    },
    bulkGet: mockBulkGet,
    save: mockSave
  }
} as any;

describe("Molecular Analysis Workflow - Step 5 - Molecular Analysis Results Step", () => {
  beforeEach(jest.clearAllMocks);

  function TestComponentWrapper(
    props: Partial<MolecularAnalysisResultsStepProps>
  ) {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [performSave, setPerformSave] = useState<boolean>(false);

    return (
      <MolecularAnalysisResultsStep
        molecularAnalysis={TEST_MOLECULAR_ANALYSIS}
        molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID}
        editMode={editMode}
        setEditMode={setEditMode}
        performSave={performSave}
        setPerformSave={setPerformSave}
        {...props}
      />
    );
  }

  describe("Sequencing Run Content Section", () => {
    it("Renders the results step with Run Items", async () => {
      const wrapper = mountWithAppContext(<TestComponentWrapper />, testCtx);
      await waitForLoadingToDisappear();

      // Verify Sequencing Run Items Table
      expect(wrapper.getByText("Sequencing Run Content:")).toBeInTheDocument();

      // Check for Material Sample Names (from TEST_MATERIAL_SAMPLE_SUMMARY)
      expect(
        wrapper.getByRole("link", { name: /sample 1/i })
      ).toBeInTheDocument();
      expect(
        wrapper.getByRole("link", { name: /sample 2/i })
      ).toBeInTheDocument();

      // Check for Run Item Names (from TEST_MOLECULAR_ANALYSIS_ITEMS_WITH_RUN)
      expect(
        wrapper.getByRole("cell", { name: /provided run item name/i })
      ).toBeInTheDocument();
    });

    it("Performs 'Auto Select' attachments for Run Items", async () => {
      const wrapper = mountWithAppContext(<TestComponentWrapper />, testCtx);
      await waitForLoadingToDisappear();

      // Find the dropdown for Run Content
      // There are two sections with "Auto Select". We need the first one (RC).
      const dropdowns = wrapper.getAllByRole("button", {
        name: /auto select/i
      });
      expect(dropdowns.length).toBeGreaterThanOrEqual(2);
      const runContentAutoSelectButton = dropdowns[0];

      // Click the dropdown
      userEvent.click(runContentAutoSelectButton);

      // Click "Attachments based on Item Name"
      userEvent.click(
        wrapper.getByRole("button", { name: /attachments based on item name/i })
      );

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });

      // Check the 1st call: Create the Molecular Analysis Result
      expect(mockSave).toHaveBeenNthCalledWith(
        1,
        [
          {
            resource: {
              group: "aafc",
              relationships: {
                attachments: {
                  data: [
                    expect.objectContaining({
                      id: TEST_METADATA_4.id,
                      type: "metadata"
                    })
                  ]
                }
              },
              type: "molecular-analysis-result"
            },
            type: "molecular-analysis-result"
          }
        ],
        { apiBaseUrl: "seqdb-api/molecular-analysis-result" }
      );

      // Check the 2nd call: Saving the Molecular Analysis Run Item (linked to the result)
      expect(mockSave).toHaveBeenNthCalledWith(
        2,
        [
          {
            resource: expect.objectContaining({
              id: TEST_MOLECULAR_ANALYSIS_ITEMS_WITH_RUN_ITEM_ID,
              name: "Provided run item name",
              relationships: {
                result: {
                  data: {
                    id: "saved-id-123",
                    type: "molecular-analysis-result"
                  }
                }
              }
            }),
            type: "molecular-analysis-run-item"
          }
        ],
        { apiBaseUrl: "seqdb-api/molecular-analysis-run-item" }
      );

      // Verify alert appears indicating attachment found
      await waitFor(() => {
        expect(
          wrapper.getByText(/1 attachment was found./i)
        ).toBeInTheDocument();
      });
    });

    it("Sequencing Run Content displays error messages for deleted or missing attachments", async () => {
      const DELETED_METADATA_ID = "deleted-metadata-id-run";
      const LOADING_ISSUE_METADATA_ID = "loading-issue-metadata-id-run";

      // Setup a result with problematic attachments
      const RESULT_WITH_ISSUES = {
        id: "result-with-issues-run",
        type: "molecular-analysis-result",
        attachments: [
          { id: DELETED_METADATA_ID, type: "metadata" },
          { id: LOADING_ISSUE_METADATA_ID, type: "metadata" }
        ]
      };

      // Setup a Run Item linked to the result
      const RUN_ITEM_WITH_ISSUES = {
        id: "run-item-issues",
        type: "molecular-analysis-run-item",
        name: "Run Item With Issues",
        usageType:
          MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM,
        result: RESULT_WITH_ISSUES,
        run: TEST_MOLECULAR_ANALYSIS_RUN
      };

      // Setup the Generic Item (Table Row) linked to the Run Item
      const GENERIC_ITEM_WITH_ISSUES = {
        id: "generic-item-issues",
        type: "generic-molecular-analysis-item",
        genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
        materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[0],
        molecularAnalysisRunItem: RUN_ITEM_WITH_ISSUES,
        storageUnitUsage: STORAGE_UNIT_USAGE_1
      };

      const mockGetWithIssues = jest.fn<any, any>(async (path, params) => {
        // Intercept request for generic items to return our test item
        if (
          path === "/seqdb-api/generic-molecular-analysis-item" &&
          params?.filter?.rsql?.includes(TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID)
        ) {
          return { data: [GENERIC_ITEM_WITH_ISSUES] };
        }
        // Intercept specific result request
        if (
          path ===
          `seqdb-api/molecular-analysis-result/${RESULT_WITH_ISSUES.id}`
        ) {
          return { data: RESULT_WITH_ISSUES };
        }

        return mockGet(path, params);
      });

      const mockBulkGetWithIssues = jest.fn(async (paths) => {
        return paths.map((path) => {
          // Handle problematic metadata
          if (path.includes(DELETED_METADATA_ID)) return null;
          if (path.includes(LOADING_ISSUE_METADATA_ID)) return undefined;

          // Handle Result (Bulk get is used for generic item results)
          if (path.includes(RESULT_WITH_ISSUES.id)) return RESULT_WITH_ISSUES;

          // Fallback for standard items needed for the table row
          if (path.includes(TEST_MATERIAL_SAMPLE_SUMMARY[0].id))
            return TEST_MATERIAL_SAMPLE_SUMMARY[0];
          if (path.includes(STORAGE_UNIT_USAGE_1.id!))
            return STORAGE_UNIT_USAGE_1;

          return null;
        });
      });

      const issuesCtx = {
        apiContext: {
          apiClient: {
            get: mockGetWithIssues,
            axios: { get: mockGetWithIssues }
          },
          bulkGet: mockBulkGetWithIssues,
          save: mockSave
        }
      } as any;

      const wrapper = mountWithAppContext(<TestComponentWrapper />, issuesCtx);
      await waitForLoadingToDisappear();

      // Verify Sequencing Run Content Header
      expect(wrapper.getByText("Sequencing Run Content:")).toBeInTheDocument();

      // Verify the specific Run Item is rendered
      expect(
        wrapper.getByRole("cell", { name: /run item with issues/i })
      ).toBeInTheDocument();

      // Verify error messages for attachments are present in the table
      expect(wrapper.getByText(/loading issue/i)).toBeInTheDocument();
      expect(wrapper.getAllByText(/not found/i).length).toBe(3); // Including quality control failures.
    });

    it("Detach all functionality", async () => {
      const RESULT_TO_DETACH = {
        id: "result-detach-run",
        type: "molecular-analysis-result",
        attachments: []
      };

      const RUN_ITEM_WITH_RESULT = {
        id: "run-item-detach",
        type: "molecular-analysis-run-item",
        name: "Run Item To Detach",
        usageType:
          MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM,
        result: RESULT_TO_DETACH,
        run: TEST_MOLECULAR_ANALYSIS_RUN
      };

      const GENERIC_ITEM_WITH_RESULT = {
        id: "generic-item-detach",
        type: "generic-molecular-analysis-item",
        genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
        materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[0],
        molecularAnalysisRunItem: RUN_ITEM_WITH_RESULT,
        storageUnitUsage: STORAGE_UNIT_USAGE_1
      };

      const mockGetWithResult = jest.fn<any, any>(async (path, params) => {
        if (
          path === "/seqdb-api/generic-molecular-analysis-item" &&
          params?.filter?.rsql?.includes(TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID)
        ) {
          return { data: [GENERIC_ITEM_WITH_RESULT] };
        }
        if (
          path === `seqdb-api/molecular-analysis-result/${RESULT_TO_DETACH.id}`
        ) {
          return { data: RESULT_TO_DETACH };
        }
        // Fallback to default mock
        return mockGet(path, params);
      });

      // Bulk get needs to handle the result lookups
      const mockBulkGetWithResult = jest.fn(async (paths) => {
        return paths.map((path) => {
          if (path.includes(RESULT_TO_DETACH.id)) return RESULT_TO_DETACH;
          if (path.includes(TEST_MATERIAL_SAMPLE_SUMMARY[0].id))
            return TEST_MATERIAL_SAMPLE_SUMMARY[0];
          if (path.includes(STORAGE_UNIT_USAGE_1.id!))
            return STORAGE_UNIT_USAGE_1;
          return null;
        });
      });

      const detachCtx = {
        apiContext: {
          apiClient: {
            get: mockGetWithResult,
            axios: { get: mockGetWithResult }
          },
          bulkGet: mockBulkGetWithResult,
          save: mockSave
        }
      } as any;

      const wrapper = mountWithAppContext(<TestComponentWrapper />, detachCtx);
      await waitForLoadingToDisappear();

      // Click Detach All button (The first one belongs to the Sequencing Run Content section)
      const detachAllButton = wrapper.getAllByRole("button", {
        name: /detach all/i
      });
      userEvent.click(detachAllButton[0]);

      // Expect save to be called to update Run Items/Results
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });

      // Remove result link from Run Item
      expect(mockSave).toHaveBeenNthCalledWith(
        1,
        [
          {
            resource: {
              id: "run-item-detach",
              relationships: {
                result: {
                  data: null
                }
              },
              type: "molecular-analysis-run-item"
            },
            type: "molecular-analysis-run-item"
          }
        ],
        { apiBaseUrl: "seqdb-api/molecular-analysis-run-item" }
      );

      // Now delete the result itself
      expect(mockSave).toHaveBeenNthCalledWith(
        2,
        [
          {
            delete: {
              id: "result-detach-run",
              type: "molecular-analysis-result"
            }
          }
        ],
        { apiBaseUrl: "seqdb-api/molecular-analysis-result" }
      );
    });

    it("Ability to delete all broken attachments directly", async () => {
      const DELETED_METADATA_ID = "deleted-metadata-id-run";
      const LOADING_ISSUE_METADATA_ID = "loading-issue-metadata-id-run";

      // Setup a result with problematic attachments
      const RESULT_WITH_ISSUES = {
        id: "result-with-issues-run",
        type: "molecular-analysis-result",
        attachments: [
          { id: DELETED_METADATA_ID, type: "metadata" },
          { id: LOADING_ISSUE_METADATA_ID, type: "metadata" }
        ]
      };

      // Setup a Run Item linked to the result
      const RUN_ITEM_WITH_ISSUES = {
        id: "run-item-issues",
        type: "molecular-analysis-run-item",
        name: "Run Item With Issues",
        usageType:
          MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM,
        result: RESULT_WITH_ISSUES,
        run: TEST_MOLECULAR_ANALYSIS_RUN
      };

      // Setup the Generic Item (Table Row) linked to the Run Item
      const GENERIC_ITEM_WITH_ISSUES = {
        id: "generic-item-issues",
        type: "generic-molecular-analysis-item",
        genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
        materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[0],
        molecularAnalysisRunItem: RUN_ITEM_WITH_ISSUES,
        storageUnitUsage: STORAGE_UNIT_USAGE_1
      };

      const mockGetWithIssues = jest.fn<any, any>(async (path, params) => {
        // Intercept request for generic items to return our test item
        if (
          path === "/seqdb-api/generic-molecular-analysis-item" &&
          params?.filter?.rsql?.includes(TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID)
        ) {
          return { data: [GENERIC_ITEM_WITH_ISSUES] };
        }
        // Intercept specific result request
        if (
          path ===
          `seqdb-api/molecular-analysis-result/${RESULT_WITH_ISSUES.id}`
        ) {
          return { data: RESULT_WITH_ISSUES };
        }

        return mockGet(path, params);
      });

      const mockBulkGetWithIssues = jest.fn(async (paths) => {
        return paths.map((path) => {
          // Handle problematic metadata
          if (path.includes(DELETED_METADATA_ID)) return null;
          if (path.includes(LOADING_ISSUE_METADATA_ID)) return undefined;

          // Handle Result (Bulk get is used for generic item results)
          if (path.includes(RESULT_WITH_ISSUES.id)) return RESULT_WITH_ISSUES;

          // Fallback for standard items needed for the table row
          if (path.includes(TEST_MATERIAL_SAMPLE_SUMMARY[0].id))
            return TEST_MATERIAL_SAMPLE_SUMMARY[0];
          if (path.includes(STORAGE_UNIT_USAGE_1.id!))
            return STORAGE_UNIT_USAGE_1;

          return null;
        });
      });

      const issuesCtx = {
        apiContext: {
          apiClient: {
            get: mockGetWithIssues,
            axios: { get: mockGetWithIssues }
          },
          bulkGet: mockBulkGetWithIssues,
          save: mockSave
        }
      } as any;

      const wrapper = mountWithAppContext(<TestComponentWrapper />, issuesCtx);
      await waitForLoadingToDisappear();

      // Verify Run Item is rendered
      expect(
        wrapper.getByRole("cell", { name: /run item with issues/i })
      ).toBeInTheDocument();

      // Verify error messages for attachments
      expect(wrapper.getByText(/loading issue/i)).toBeInTheDocument();
      expect(wrapper.getAllByText(/not found/i).length).toBeGreaterThan(0);

      // Click the "Add" button (The first one corresponds to the Run Content section)
      userEvent.click(wrapper.getAllByRole("button", { name: /add/i })[0]);
      await waitForLoadingToDisappear();

      // Check the "Select all" checkbox.
      userEvent.click(wrapper.getByRole("checkbox", { name: /check all/i }));

      // Click the "Detach Selected" button.
      userEvent.click(
        wrapper.getByRole("button", { name: /detach selected/i })
      );
      await waitForLoadingToDisappear();

      // Expect save to be called to update the Molecular Analysis Result
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });

      // Delete the result link from the Run Item
      expect(mockSave).toHaveBeenNthCalledWith(
        1,
        [
          {
            resource: {
              id: "run-item-issues",
              relationships: {
                result: {
                  data: null
                }
              },
              type: "molecular-analysis-run-item"
            },
            type: "molecular-analysis-run-item"
          }
        ],
        { apiBaseUrl: "seqdb-api/molecular-analysis-run-item" }
      );

      // Delete the result itself now it has been unlinked.
      expect(mockSave).toHaveBeenNthCalledWith(
        2,
        [
          {
            delete: {
              id: "result-with-issues-run",
              type: "molecular-analysis-result"
            }
          }
        ],
        { apiBaseUrl: "seqdb-api/molecular-analysis-result" }
      );
    });

    it("Ability to delete one broken attachment directly", async () => {
      const DELETED_METADATA_ID = "deleted-metadata-id-run";
      const LOADING_ISSUE_METADATA_ID = "loading-issue-metadata-id-run";

      const RESULT_WITH_ISSUES = {
        id: "result-with-issues-run",
        type: "molecular-analysis-result",
        attachments: [
          { id: DELETED_METADATA_ID, type: "metadata" },
          { id: LOADING_ISSUE_METADATA_ID, type: "metadata" }
        ]
      };

      const RUN_ITEM_WITH_ISSUES = {
        id: "run-item-issues",
        type: "molecular-analysis-run-item",
        name: "Run Item With Issues",
        usageType:
          MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM,
        result: RESULT_WITH_ISSUES,
        run: TEST_MOLECULAR_ANALYSIS_RUN
      };

      const GENERIC_ITEM_WITH_ISSUES = {
        id: "generic-item-issues",
        type: "generic-molecular-analysis-item",
        genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
        materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[0],
        molecularAnalysisRunItem: RUN_ITEM_WITH_ISSUES,
        storageUnitUsage: STORAGE_UNIT_USAGE_1
      };

      const mockGetWithIssues = jest.fn<any, any>(async (path, params) => {
        if (
          path === "/seqdb-api/generic-molecular-analysis-item" &&
          params?.filter?.rsql?.includes(TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID)
        ) {
          return { data: [GENERIC_ITEM_WITH_ISSUES] };
        }
        if (
          path ===
          `seqdb-api/molecular-analysis-result/${RESULT_WITH_ISSUES.id}`
        ) {
          return { data: RESULT_WITH_ISSUES };
        }
        return mockGet(path, params);
      });

      const mockBulkGetWithIssues = jest.fn(async (paths) => {
        return paths.map((path) => {
          if (path.includes(DELETED_METADATA_ID)) return null;
          if (path.includes(LOADING_ISSUE_METADATA_ID)) return undefined;
          if (path.includes(RESULT_WITH_ISSUES.id)) return RESULT_WITH_ISSUES;
          if (path.includes(TEST_MATERIAL_SAMPLE_SUMMARY[0].id))
            return TEST_MATERIAL_SAMPLE_SUMMARY[0];
          if (path.includes(STORAGE_UNIT_USAGE_1.id!))
            return STORAGE_UNIT_USAGE_1;
          return null;
        });
      });

      const issuesCtx = {
        apiContext: {
          apiClient: {
            get: mockGetWithIssues,
            axios: { get: mockGetWithIssues }
          },
          bulkGet: mockBulkGetWithIssues,
          save: mockSave
        }
      } as any;

      const wrapper = mountWithAppContext(<TestComponentWrapper />, issuesCtx);
      await waitForLoadingToDisappear();

      // Verify Run Item is rendered
      expect(
        wrapper.getByRole("cell", { name: /run item with issues/i })
      ).toBeInTheDocument();

      // Click the "Add" button (First one for Run Content)
      userEvent.click(wrapper.getAllByRole("button", { name: /add/i })[0]);
      await waitForLoadingToDisappear();

      // Check the checkbox for just the deleted attachment (index 1)
      userEvent.click(wrapper.getAllByRole("checkbox")[1]);

      // Click the "Detach Selected" button.
      userEvent.click(
        wrapper.getByRole("button", { name: /detach selected/i })
      );
      await waitForLoadingToDisappear();

      // Expect save to be called to update the Molecular Analysis Result
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });

      // Update the result to remove the specific attachment
      expect(mockSave).toHaveBeenNthCalledWith(
        1,
        [
          {
            resource: {
              id: "result-with-issues-run",
              relationships: {
                attachments: {
                  data: [
                    {
                      id: LOADING_ISSUE_METADATA_ID,
                      type: "metadata"
                    }
                  ]
                }
              },
              type: "molecular-analysis-result"
            },
            type: "molecular-analysis-result"
          }
        ],
        { apiBaseUrl: "seqdb-api/molecular-analysis-result" }
      );
    });
  });

  describe("Sequencing Quality Control Section", () => {
    it("Renders the results step with Run Items and Quality Controls", async () => {
      const wrapper = mountWithAppContext(<TestComponentWrapper />, testCtx);
      await waitForLoadingToDisappear();

      // Verify Quality Controls Table
      expect(
        wrapper.getByText("Sequencing Quality Control:")
      ).toBeInTheDocument();

      // Check for QC Names (from TEST_QUALITY_CONTROL_1 and 2)
      expect(wrapper.getByRole("cell", { name: /test1/i })).toBeInTheDocument();
      expect(wrapper.getByRole("cell", { name: /test2/i })).toBeInTheDocument();

      // Check QC Types
      expect(wrapper.getByText("Reserpine Standard")).toBeInTheDocument();
      expect(wrapper.getByText("ACN Blank")).toBeInTheDocument();

      // Expect existing attachments to be shown for QC 1
      expect(
        wrapper.getAllByText(TEST_METADATA_1?.originalFilename ?? "")[0]
      ).toBeInTheDocument();
      expect(
        wrapper.getByText(TEST_METADATA_2?.originalFilename ?? "")
      ).toBeInTheDocument();
    });

    it("Performs 'Auto Select' attachments for Quality Controls", async () => {
      const wrapper = mountWithAppContext(<TestComponentWrapper />, testCtx);
      await waitForLoadingToDisappear();

      // Find the dropdown for Quality Control
      // There are two sections with "Auto Select". We need the second one (QC).
      const dropdowns = wrapper.getAllByRole("button", {
        name: /auto select/i
      });
      expect(dropdowns.length).toBeGreaterThanOrEqual(2);
      const qcAutoSelectButton = dropdowns[1];

      // Click QC Auto Select
      userEvent.click(qcAutoSelectButton);

      // Click "Attachments based on Item Name"
      userEvent.click(
        wrapper.getByRole("button", { name: /attachments based on item name/i })
      );

      // Expect save to be called to update Quality Controls/Results
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });

      // Verify that what was saved was the correct metadata linked to the QC Result
      expect(mockSave).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            id: TEST_MOLECULAR_ANALYSIS_RESULT.id,
            type: "molecular-analysis-result",
            resource: expect.objectContaining({
              relationships: {
                attachments: {
                  data: [
                    // Existing attachments remain
                    {
                      id: TEST_METADATA_1.id,
                      type: "metadata"
                    },
                    {
                      id: TEST_METADATA_2.id,
                      type: "metadata"
                    },

                    // Newly added attachment from the Run Item auto-select
                    {
                      id: TEST_METADATA_3.id,
                      type: "metadata"
                    }
                  ]
                }
              }
            })
          })
        ],
        expect.anything()
      );

      // Verify alert appears indicating attachment found for QC
      await waitFor(() => {
        const alerts = wrapper.getAllByText(/1 attachment was found./i);
        expect(alerts.length).toBeGreaterThan(0);
      });
    });

    it("Quality Control displays error messages for deleted or missing attachments", async () => {
      const DELETED_METADATA_ID = "deleted-metadata-id";
      const LOADING_ISSUE_METADATA_ID = "loading-issue-metadata-id";

      const RESULT_WITH_ISSUES = {
        id: "result-with-issues",
        type: "molecular-analysis-result",
        attachments: [
          { id: DELETED_METADATA_ID, type: "metadata" },
          { id: LOADING_ISSUE_METADATA_ID, type: "metadata" }
        ]
      };

      const QC_RUN_ITEM_WITH_ISSUES = {
        id: "qc-run-item-issues",
        type: "molecular-analysis-run-item",
        usageType: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL,
        result: RESULT_WITH_ISSUES
      };

      const QC_WITH_ISSUES = {
        id: "qc-issues",
        type: "quality-control",
        name: "QC With Issues",
        qcType: "reserpine_standard",
        molecularAnalysisRunItem: QC_RUN_ITEM_WITH_ISSUES
      };

      const mockGetWithIssues = jest.fn<any, any>(async (path, params) => {
        if (
          path === "seqdb-api/molecular-analysis-run-item" &&
          params?.filter?.rsql?.includes(
            MolecularAnalysisRunItemUsageType.QUALITY_CONTROL
          )
        ) {
          return { data: [QC_RUN_ITEM_WITH_ISSUES] };
        }
        if (
          path === "seqdb-api/quality-control" &&
          params?.filter?.rsql?.includes(QC_RUN_ITEM_WITH_ISSUES.id)
        ) {
          return { data: [QC_WITH_ISSUES] };
        }
        if (
          path ===
          `seqdb-api/molecular-analysis-result/${RESULT_WITH_ISSUES.id}`
        ) {
          return { data: RESULT_WITH_ISSUES };
        }

        return mockGet(path, params);
      });

      const mockBulkGetWithIssues = jest.fn(async (paths) => {
        const results = await mockBulkGet(paths);
        return results.map((result, index) => {
          const path = paths[index];
          if (path.includes(DELETED_METADATA_ID)) return null;
          if (path.includes(LOADING_ISSUE_METADATA_ID)) return undefined;
          return result;
        });
      });

      const issuesCtx = {
        apiContext: {
          apiClient: {
            get: mockGetWithIssues,
            axios: { get: mockGetWithIssues }
          },
          bulkGet: mockBulkGetWithIssues,
          save: mockSave
        }
      } as any;

      const wrapper = mountWithAppContext(<TestComponentWrapper />, issuesCtx);
      await waitForLoadingToDisappear();

      // Verify QC item is rendered
      expect(wrapper.getByText("QC With Issues")).toBeInTheDocument();

      // Verify error messages for attachments
      expect(wrapper.getByText(/loading issue/i)).toBeInTheDocument();
      expect(wrapper.getByText(/not found/i)).toBeInTheDocument();
    });

    it("Detach all functionality", async () => {
      const wrapper = mountWithAppContext(<TestComponentWrapper />, testCtx);
      await waitForLoadingToDisappear();

      // Click Detach All button (2nd one)
      const detachAllButton = wrapper.getAllByRole("button", {
        name: /detach all/i
      });
      userEvent.click(detachAllButton[2]);

      // Expect save to be called to update Quality Controls/Results
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });

      // Remove result link from Run Item
      expect(mockSave).toHaveBeenNthCalledWith(
        1,
        [
          {
            id: "2a3b15ce-6781-466b-bc1e-49e35af3df58",
            resource: {
              id: "2a3b15ce-6781-466b-bc1e-49e35af3df58",
              relationships: {
                result: {
                  data: null
                }
              },
              type: "molecular-analysis-run-item"
            },
            type: "molecular-analysis-run-item"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      );

      // Now delete the result itself
      expect(mockSave).toHaveBeenNthCalledWith(
        2,
        [
          {
            delete: {
              id: "cf1655f6-c6d4-484d-a8c4-5f328ccf645f",
              type: "molecular-analysis-result"
            }
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      );
    });

    it("Ability to delete all broken attachments directly", async () => {
      const DELETED_METADATA_ID = "deleted-metadata-id";
      const LOADING_ISSUE_METADATA_ID = "loading-issue-metadata-id";

      const RESULT_WITH_ISSUES = {
        id: "result-with-issues",
        type: "molecular-analysis-result",
        attachments: [
          { id: DELETED_METADATA_ID, type: "metadata" },
          { id: LOADING_ISSUE_METADATA_ID, type: "metadata" }
        ]
      };

      const QC_RUN_ITEM_WITH_ISSUES = {
        id: "qc-run-item-issues",
        type: "molecular-analysis-run-item",
        usageType: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL,
        result: RESULT_WITH_ISSUES
      };

      const QC_WITH_ISSUES = {
        id: "qc-issues",
        type: "quality-control",
        name: "QC With Issues",
        qcType: "reserpine_standard",
        molecularAnalysisRunItem: QC_RUN_ITEM_WITH_ISSUES
      };

      const mockGetWithIssues = jest.fn<any, any>(async (path, params) => {
        if (
          path === "seqdb-api/molecular-analysis-run-item" &&
          params?.filter?.rsql?.includes(
            MolecularAnalysisRunItemUsageType.QUALITY_CONTROL
          )
        ) {
          return { data: [QC_RUN_ITEM_WITH_ISSUES] };
        }
        if (
          path === "seqdb-api/quality-control" &&
          params?.filter?.rsql?.includes(QC_RUN_ITEM_WITH_ISSUES.id)
        ) {
          return { data: [QC_WITH_ISSUES] };
        }
        if (
          path ===
          `seqdb-api/molecular-analysis-result/${RESULT_WITH_ISSUES.id}`
        ) {
          return { data: RESULT_WITH_ISSUES };
        }

        return mockGet(path, params);
      });

      const mockBulkGetWithIssues = jest.fn(async (paths) => {
        const results = await mockBulkGet(paths);
        return results.map((result, index) => {
          const path = paths[index];
          if (path.includes(DELETED_METADATA_ID)) return null;
          if (path.includes(LOADING_ISSUE_METADATA_ID)) return undefined;
          return result;
        });
      });

      const issuesCtx = {
        apiContext: {
          apiClient: {
            get: mockGetWithIssues,
            axios: { get: mockGetWithIssues }
          },
          bulkGet: mockBulkGetWithIssues,
          save: mockSave
        }
      } as any;

      const wrapper = mountWithAppContext(<TestComponentWrapper />, issuesCtx);
      await waitForLoadingToDisappear();

      // Verify QC item is rendered
      expect(wrapper.getByText("QC With Issues")).toBeInTheDocument();

      // Verify error messages for attachments
      expect(wrapper.getByText(/loading issue/i)).toBeInTheDocument();
      expect(wrapper.getByText(/not found/i)).toBeInTheDocument();

      // Click the "Add" button which will display a popup menu with all the existing attachments.
      userEvent.click(wrapper.getAllByRole("button", { name: /add/i })[2]);
      await waitForLoadingToDisappear();

      // Check the "Select all" checkbox.
      userEvent.click(wrapper.getByRole("checkbox", { name: /check all/i }));

      // Click the "Detach Selected" button.
      userEvent.click(
        wrapper.getByRole("button", { name: /detach selected/i })
      );
      await waitForLoadingToDisappear();

      // Expect save to be called to update the Molecular Analysis Result
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });

      // Delete the result link from the QC Run Item
      expect(mockSave).toHaveBeenNthCalledWith(
        1,
        [
          {
            id: "qc-run-item-issues",
            resource: {
              id: "qc-run-item-issues",
              relationships: {
                result: {
                  data: null
                }
              },
              type: "molecular-analysis-run-item"
            },
            type: "molecular-analysis-run-item"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      );

      // Delete the result itself now it has been unlinked.
      expect(mockSave).toHaveBeenNthCalledWith(
        2,
        [
          {
            delete: {
              id: "result-with-issues",
              type: "molecular-analysis-result"
            }
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      );
    });

    it("Ability to delete one broken attachment directly", async () => {
      const DELETED_METADATA_ID = "deleted-metadata-id";
      const LOADING_ISSUE_METADATA_ID = "loading-issue-metadata-id";

      const RESULT_WITH_ISSUES = {
        id: "result-with-issues",
        type: "molecular-analysis-result",
        attachments: [
          { id: DELETED_METADATA_ID, type: "metadata" },
          { id: LOADING_ISSUE_METADATA_ID, type: "metadata" }
        ]
      };

      const QC_RUN_ITEM_WITH_ISSUES = {
        id: "qc-run-item-issues",
        type: "molecular-analysis-run-item",
        usageType: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL,
        result: RESULT_WITH_ISSUES
      };

      const QC_WITH_ISSUES = {
        id: "qc-issues",
        type: "quality-control",
        name: "QC With Issues",
        qcType: "reserpine_standard",
        molecularAnalysisRunItem: QC_RUN_ITEM_WITH_ISSUES
      };

      const mockGetWithIssues = jest.fn<any, any>(async (path, params) => {
        if (
          path === "seqdb-api/molecular-analysis-run-item" &&
          params?.filter?.rsql?.includes(
            MolecularAnalysisRunItemUsageType.QUALITY_CONTROL
          )
        ) {
          return { data: [QC_RUN_ITEM_WITH_ISSUES] };
        }
        if (
          path === "seqdb-api/quality-control" &&
          params?.filter?.rsql?.includes(QC_RUN_ITEM_WITH_ISSUES.id)
        ) {
          return { data: [QC_WITH_ISSUES] };
        }
        if (
          path ===
          `seqdb-api/molecular-analysis-result/${RESULT_WITH_ISSUES.id}`
        ) {
          return { data: RESULT_WITH_ISSUES };
        }

        return mockGet(path, params);
      });

      const mockBulkGetWithIssues = jest.fn(async (paths) => {
        const results = await mockBulkGet(paths);
        return results.map((result, index) => {
          const path = paths[index];
          if (path.includes(DELETED_METADATA_ID)) return null;
          if (path.includes(LOADING_ISSUE_METADATA_ID)) return undefined;
          return result;
        });
      });

      const issuesCtx = {
        apiContext: {
          apiClient: {
            get: mockGetWithIssues,
            axios: { get: mockGetWithIssues }
          },
          bulkGet: mockBulkGetWithIssues,
          save: mockSave
        }
      } as any;

      const wrapper = mountWithAppContext(<TestComponentWrapper />, issuesCtx);
      await waitForLoadingToDisappear();

      // Verify QC item is rendered
      expect(wrapper.getByText("QC With Issues")).toBeInTheDocument();

      // Verify error messages for attachments
      expect(wrapper.getByText(/loading issue/i)).toBeInTheDocument();
      expect(wrapper.getByText(/not found/i)).toBeInTheDocument();

      // Click the "Add" button which will display a popup menu with all the existing attachments.
      userEvent.click(wrapper.getAllByRole("button", { name: /add/i })[2]);
      await waitForLoadingToDisappear();

      // Check the checkbox for just the deleted attachment.
      userEvent.click(wrapper.getAllByRole("checkbox")[1]);

      // Click the "Detach Selected" button.
      userEvent.click(
        wrapper.getByRole("button", { name: /detach selected/i })
      );
      await waitForLoadingToDisappear();

      // Expect save to be called to update the Molecular Analysis Result
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });

      // Delete the result link from the QC Run Item
      expect(mockSave).toHaveBeenNthCalledWith(
        1,
        [
          {
            id: "result-with-issues",
            resource: {
              id: "result-with-issues",
              relationships: {
                attachments: {
                  data: [
                    {
                      id: LOADING_ISSUE_METADATA_ID,
                      type: "metadata"
                    }
                  ]
                }
              },
              type: "molecular-analysis-result"
            },
            type: "molecular-analysis-result"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      );
    });
  });

  describe("Sequencing Run Attachments Section", () => {
    it("Detaches an existing run attachment", async () => {
      const wrapper = mountWithAppContext(<TestComponentWrapper />, testCtx);
      await waitForLoadingToDisappear();

      // The run attachment (japan.jpg / TEST_METADATA_1) should be visible
      expect(
        wrapper.getAllByText(TEST_METADATA_1.originalFilename ?? "")[1]
      ).toBeInTheDocument();

      // Find and click the detach button for that attachment
      const detachButtons = wrapper.getAllByRole("button", { name: /detach/i });
      // The last detach button belongs to the run attachments table
      userEvent.click(detachButtons[detachButtons.length - 1]);

      // Trigger the save
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });

      // The attachment should have been saved with it removed
      expect(mockSave).toHaveBeenCalledWith(
        [
          {
            id: TEST_MOLECULAR_ANALYSIS_RUN_ID,
            resource: {
              id: TEST_MOLECULAR_ANALYSIS_RUN_ID,
              relationships: {
                attachments: {
                  data: []
                }
              },
              type: "molecular-analysis-run"
            },
            type: "molecular-analysis-run"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      );
    });
  });

  it("Displays info message when no run exists", async () => {
    // Override the mock to return no items for a different ID or filter
    const emptyCtx = {
      ...testCtx,
      apiContext: {
        ...testCtx.apiContext,
        apiClient: {
          ...testCtx.apiContext.apiClient,
          get: jest.fn((_path) => {
            // Default empty returns
            return Promise.resolve({ data: [] });
          })
        }
      }
    };

    const wrapper = mountWithAppContext(<TestComponentWrapper />, emptyCtx);

    await waitForLoadingToDisappear();

    expect(
      wrapper.getByText(
        "There are no runs for this molecular analysis workflow. Select the Run tab to generate them."
      )
    ).toBeInTheDocument();
  });
});
