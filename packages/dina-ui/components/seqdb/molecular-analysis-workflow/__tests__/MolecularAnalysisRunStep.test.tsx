import { mountWithAppContext2 } from "../../../../../dina-ui/test-util/mock-app-context";
import { noop } from "lodash";
import {
  waitFor,
  waitForElementToBeRemoved,
  screen
} from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { useState, useEffect } from "react";
import {
  STORAGE_UNIT_USAGE_1,
  STORAGE_UNIT_USAGE_2,
  STORAGE_UNIT_USAGE_3,
  TEST_MATERIAL_SAMPLE_SUMMARY,
  TEST_METADATA,
  TEST_MOLECULAR_ANALYSIS,
  TEST_MOLECULAR_ANALYSIS_ITEMS_MULTIPLE_RUN,
  TEST_MOLECULAR_ANALYSIS_ITEMS_WITH_RUN,
  TEST_MOLECULAR_ANALYSIS_ITEMS_WITHOUT_RUN,
  TEST_MOLECULAR_ANALYSIS_MULTIPLE_RUN_ID,
  TEST_MOLECULAR_ANALYSIS_RUN,
  TEST_MOLECULAR_ANALYSIS_RUN_ID,
  TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID,
  TEST_MOLECULAR_ANALYSIS_WITHOUT_RUN_ID
} from "../__mocks__/MolecularAnalysisMocks";
import {
  MolecularAnalysisRunStep,
  MolecularAnalysisRunStepProps
} from "../MolecularAnalysisRunStep";

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "/seqdb-api/generic-molecular-analysis-item":
      switch (params.filter.rsql) {
        case "genericMolecularAnalysis.uuid==" +
          TEST_MOLECULAR_ANALYSIS_MULTIPLE_RUN_ID:
          return { data: TEST_MOLECULAR_ANALYSIS_ITEMS_MULTIPLE_RUN };
        case "genericMolecularAnalysis.uuid==" +
          TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID:
          return { data: TEST_MOLECULAR_ANALYSIS_ITEMS_WITH_RUN };
        case "genericMolecularAnalysis.uuid==" +
          TEST_MOLECULAR_ANALYSIS_WITHOUT_RUN_ID:
          return { data: TEST_MOLECULAR_ANALYSIS_ITEMS_WITHOUT_RUN };
      }

    case "seqdb-api/molecular-analysis-run/" + TEST_MOLECULAR_ANALYSIS_RUN_ID:
      return { data: TEST_MOLECULAR_ANALYSIS_RUN };

    case "objectstore-api/metadata":
    case "seqdb-api/molecular-analysis-run/" +
      TEST_MOLECULAR_ANALYSIS_RUN_ID +
      "/attachments":
      return {
        data: [TEST_METADATA]
      };

    // Blob storage
    case "":
      return {};
  }
});

const mockBulkGet = jest.fn(async (paths) => {
  return paths.map((path: string) => {
    switch (path) {
      // Storage Unit Usage Requests
      case "/storage-unit-usage/" + STORAGE_UNIT_USAGE_1.id:
        return STORAGE_UNIT_USAGE_1;
      case "/storage-unit-usage/" + STORAGE_UNIT_USAGE_2.id:
        return STORAGE_UNIT_USAGE_2;
      case "/storage-unit-usage/" + STORAGE_UNIT_USAGE_3.id:
        return STORAGE_UNIT_USAGE_3;

      // Material Sample Summary
      case "/material-sample-summary/" + TEST_MATERIAL_SAMPLE_SUMMARY[0].id:
        return TEST_MATERIAL_SAMPLE_SUMMARY[0];
      case "/material-sample-summary/" + TEST_MATERIAL_SAMPLE_SUMMARY[1].id:
        return TEST_MATERIAL_SAMPLE_SUMMARY[1];
      case "/material-sample-summary/" + TEST_MATERIAL_SAMPLE_SUMMARY[2].id:
        return TEST_MATERIAL_SAMPLE_SUMMARY[2];

      // Attachments
      case "metadata/7f3eccfa-3bc1-412f-9385-bb00e2319ac6?include=derivatives":
      case "metadata/7f3eccfa-3bc1-412f-9385-bb00e2319ac6?include=acMetadataCreator,derivatives":
        return TEST_METADATA;
    }
  });
});

const mockSave = jest.fn((ops) =>
  ops.map((op) => ({
    ...op.resource,
    id: op.resource.id ?? "123"
  }))
);

const mockSetEditMode = jest.fn();

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

describe("Molecular Analysis Workflow - Step 4 - Molecular Analysis Run Step", () => {
  beforeEach(jest.clearAllMocks);

  it("Loading spinner is displayed on first load", async () => {
    const wrapper = mountWithAppContext2(
      <MolecularAnalysisRunStep
        editMode={false}
        performSave={false}
        molecularAnalysis={TEST_MOLECULAR_ANALYSIS}
        molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID}
        setEditMode={noop}
        setPerformSave={noop}
      />,
      testCtx
    );

    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Display the sequencing run in the UI", async () => {
    const wrapper = mountWithAppContext2(
      <MolecularAnalysisRunStep
        editMode={true}
        performSave={false}
        molecularAnalysis={TEST_MOLECULAR_ANALYSIS}
        molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID}
        setEditMode={mockSetEditMode}
        setPerformSave={noop}
      />,
      testCtx
    );

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Alert should not exist, since there is only one run.
    expect(wrapper.queryByRole("alert")).not.toBeInTheDocument();

    // Run name should be in the textbox.
    const sequencingRunNameInput = wrapper.container.querySelector(
      'input[name="sequencingRunName"]'
    );
    expect(sequencingRunNameInput).toHaveDisplayValue("run-name-1");

    // Ensure Primary IDs are rendered in the table with links:
    expect(
      wrapper.getByRole("link", { name: /sample 1/i }).getAttribute("href")
    ).toEqual(
      "/collection/material-sample/view?id=" +
        TEST_MATERIAL_SAMPLE_SUMMARY[0].id
    );
    expect(
      wrapper.getByRole("link", { name: /sample 2/i }).getAttribute("href")
    ).toEqual(
      "/collection/material-sample/view?id=" +
        TEST_MATERIAL_SAMPLE_SUMMARY[1].id
    );

    // Ensure Tube Number is rendered:
    expect(wrapper.getByRole("cell", { name: "1" })).toBeInTheDocument();
    expect(wrapper.getByRole("cell", { name: "2" })).toBeInTheDocument();

    // Ensure Well Coordinates is rendered:
    expect(wrapper.getByRole("cell", { name: "A1" })).toBeInTheDocument();
    expect(wrapper.getByRole("cell", { name: "A2" })).toBeInTheDocument();

    // Ensure attachment appears.
    expect(
      wrapper.getByRole("heading", {
        name: /sequencing run attachments \(1\)/i
      })
    ).toBeInTheDocument();

    // Set edit mode should not be triggered in this test.
    expect(mockSetEditMode).toBeCalledTimes(0);
  });

  it("Multiple runs exist for one seq-batch, display warning to user", async () => {
    const wrapper = mountWithAppContext2(
      <MolecularAnalysisRunStep
        editMode={true}
        performSave={false}
        molecularAnalysis={TEST_MOLECULAR_ANALYSIS}
        molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_MULTIPLE_RUN_ID} // Use the Molecular Analysis ID with multiple runs
        setEditMode={mockSetEditMode}
        setPerformSave={noop}
      />,
      testCtx
    );

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Alert should exist indicating that multiple runs exist.
    expect(wrapper.getByRole("alert")).toBeInTheDocument();
    expect(
      wrapper.getByText(
        /multiple runs exist for this molecular analysis workflow\./i
      )
    ).toBeInTheDocument();

    // Run name should be in the textbox for the first run found.
    const sequencingRunNameInput = wrapper.container.querySelector(
      'input[name="sequencingRunName"]'
    );
    expect(sequencingRunNameInput).toHaveDisplayValue("run-name-1");

    // Set edit mode should not be triggered in this test.
    expect(mockSetEditMode).toBeCalledTimes(0);
  });

  // Helper component for performing saving and editing.
  function TestComponent(props: Partial<MolecularAnalysisRunStepProps>) {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [performSave, setPerformSave] = useState<boolean>(false);

    useEffect(() => {
      mockSetEditMode(editMode);
    }, [editMode]);

    return (
      <>
        <p>Edit mode: {editMode ? "true" : "false"}</p>
        <button onClick={() => setPerformSave(true)}>Save</button>
        <button onClick={() => setEditMode(true)}>Edit</button>
        <button onClick={() => setEditMode(false)}>Cancel</button>

        <MolecularAnalysisRunStep
          editMode={editMode}
          performSave={performSave}
          molecularAnalysis={TEST_MOLECULAR_ANALYSIS}
          molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_WITHOUT_RUN_ID}
          setEditMode={setEditMode}
          setPerformSave={setPerformSave}
          {...props}
        />
      </>
    );
  }

  it("No run exists, in edit mode, create a new run", async () => {
    const wrapper = mountWithAppContext2(<TestComponent />, testCtx);

    // Automatically go into edit mode if no sequencing runs exist.
    await waitFor(() => {
      expect(mockSetEditMode).toBeCalledWith(true);
    });

    // Expect the Sequencing run to be empty since no run exists yet.
    const sequencingRunNameInput = wrapper.container.querySelector(
      'input[name="sequencingRunName"]'
    );
    expect(sequencingRunNameInput).toHaveDisplayValue("");

    // Try saving with no sequencing run name, it should report an error.
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(wrapper.queryByRole("alert")).toBeInTheDocument();
    });
    expect(
      wrapper.getByText(
        /a sequencing run name must be provided in order to generate a sequence run\./i
      )
    ).toBeInTheDocument();

    // Type a name for the run to be created.
    userEvent.type(sequencingRunNameInput!, "My new run");

    // Click the save button.
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // No errors should be present at this point.
    expect(wrapper.queryByRole("alert")).not.toBeInTheDocument();

    // Ensure all API save requests are made correctly.
    expect(mockSave.mock.calls).toEqual([
      // Molecular Analysis Run
      [
        [
          {
            resource: {
              group: "aafc",
              name: "My new run",
              type: "molecular-analysis-run"
            },
            type: "molecular-analysis-run"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      // Molecular Analysis Run Items
      [
        [
          {
            resource: {
              relationships: {
                run: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run"
                  }
                }
              },
              usageType: "generic-molecular-analysis-item",
              type: "molecular-analysis-run-item"
            },
            type: "molecular-analysis-run-item"
          },
          {
            resource: {
              relationships: {
                run: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run"
                  }
                }
              },
              usageType: "generic-molecular-analysis-item",
              type: "molecular-analysis-run-item"
            },
            type: "molecular-analysis-run-item"
          },
          {
            resource: {
              relationships: {
                run: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run"
                  }
                }
              },
              usageType: "generic-molecular-analysis-item",
              type: "molecular-analysis-run-item"
            },
            type: "molecular-analysis-run-item"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      // Molecular-analysis-run-item Update
      [
        [
          {
            resource: {
              id: "99ecc6fc-7378-4641-8914-1b9104e37b95",
              relationships: {
                molecularAnalysisRunItem: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run-item"
                  }
                }
              },
              type: "generic-molecular-analysis-item"
            },
            type: "generic-molecular-analysis-item"
          },
          {
            resource: {
              id: "169eafe4-44f2-407e-aa90-1a5483edf522",
              relationships: {
                molecularAnalysisRunItem: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run-item"
                  }
                }
              },
              type: "generic-molecular-analysis-item"
            },
            type: "generic-molecular-analysis-item"
          },
          {
            resource: {
              id: "9df16fe8-8510-4723-8f88-0a6bc0536624",
              relationships: {
                molecularAnalysisRunItem: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run-item"
                  }
                }
              },
              type: "generic-molecular-analysis-item"
            },
            type: "generic-molecular-analysis-item"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ]
    ]);
  });

  it("Run exists, in edit mode, update the existing run", async () => {
    const wrapper = mountWithAppContext2(
      <TestComponent
        molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID}
      />,
      testCtx
    );

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Should not be in edit mode automatically since a run exists already.
    expect(wrapper.queryByText(/edit mode: false/i)).toBeInTheDocument();

    // Switch into edit mode:
    userEvent.click(wrapper.getByRole("button", { name: "Edit" }));
    expect(wrapper.queryByText(/edit mode: true/i)).toBeInTheDocument();

    // Change the sequencing run name to something different.
    const sequencingRunNameInput = wrapper.container.querySelector(
      'input[name="sequencingRunName"]'
    );
    userEvent.clear(sequencingRunNameInput!);
    userEvent.type(sequencingRunNameInput!, "Updated run name");

    // Click the save button.
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // No errors should be present at this point.
    expect(wrapper.queryByRole("alert")).not.toBeInTheDocument();
    expect(wrapper.queryByText(/edit mode: false/i)).toBeInTheDocument();

    // Expect the network request to only contain the update of the run.
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "5fee24e2-2ab1-4511-a6e6-4f8ef237f6c4",
              name: "Updated run name",
              relationships: {
                attachments: {
                  data: [
                    {
                      id: "7f3eccfa-3bc1-412f-9385-bb00e2319ac6",
                      type: "metadata"
                    }
                  ]
                }
              },
              type: "molecular-analysis-run"
            },
            type: "molecular-analysis-run"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ]
    ]);
  });

  it("Automatically switch to edit mode and be able to cancel", async () => {
    const wrapper = mountWithAppContext2(<TestComponent />, testCtx);

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Should be in edit mode automatically since no runs exist.
    expect(wrapper.queryByText(/edit mode: true/i)).toBeInTheDocument();

    // Cancel out of edit mode.
    userEvent.click(wrapper.getByRole("button", { name: /cancel/i }));

    // Even though we still have no runs, since the user explictly canceled
    expect(wrapper.queryByText(/edit mode: false/i)).toBeInTheDocument();

    // Info alert to display that no sequencing runs exist
    expect(wrapper.queryByRole("alert")).toBeInTheDocument();
  });
});
