import { mountWithAppContext } from "common-ui";
import { noop } from "lodash";
import { waitFor, waitForElementToBeRemoved } from "@testing-library/react";
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
  TEST_MOLECULAR_ANALYSIS_RESULT,
  TEST_MOLECULAR_ANALYSIS_RUN,
  TEST_MOLECULAR_ANALYSIS_RUN_ID,
  TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID,
  TEST_MOLECULAR_ANALYSIS_WITHOUT_RUN_ID,
  TEST_QUALITY_CONTROL_1,
  TEST_QUALITY_CONTROL_2,
  TEST_QUALITY_CONTROL_RUN_ITEMS,
  TEST_QUALITY_CONTROL_TYPES
} from "../__mocks__/MolecularAnalysisMocks";
import {
  MolecularAnalysisRunStep,
  MolecularAnalysisRunStepProps
} from "../MolecularAnalysisRunStep";
import { MolecularAnalysisRunItemUsageType } from "../../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";

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

    case "seqdb-api/molecular-analysis-run-item":
      switch (params.filter.rsql) {
        case "run.uuid==" +
          TEST_MOLECULAR_ANALYSIS_RUN_ID +
          ";usageType==" +
          MolecularAnalysisRunItemUsageType.QUALITY_CONTROL:
          return { data: TEST_QUALITY_CONTROL_RUN_ITEMS };
      }

    case "seqdb-api/molecular-analysis-result/" +
      TEST_MOLECULAR_ANALYSIS_RESULT.id:
      return { data: TEST_MOLECULAR_ANALYSIS_RESULT };

    case "seqdb-api/quality-control":
      switch (params.filter.rsql) {
        case "molecularAnalysisRunItem.uuid==2a3b15ce-6781-466b-bc1e-49e35af3df58":
          return { data: TEST_QUALITY_CONTROL_1 };
        case "molecularAnalysisRunItem.uuid==e9e39b72-ece7-454b-893a-2fc2d075e7b7":
          return { data: TEST_QUALITY_CONTROL_2 };
      }

    case "seqdb-api/vocabulary/qualityControlType":
      return { data: TEST_QUALITY_CONTROL_TYPES };

    case "objectstore-api/metadata":
    case "seqdb-api/molecular-analysis-run/" +
      TEST_MOLECULAR_ANALYSIS_RUN_ID +
      "/attachments":
      return {
        data: [TEST_METADATA]
      };
    case "objectstore-api/config/file-upload":
      return {
        data: {
          id: "file-upload",
          type: "config",
          attributes: {
            "max-request-size": "1000MB",
            "max-file-size": "1000MB"
          }
        }
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
    id: op?.resource?.id ?? "123"
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
    const wrapper = mountWithAppContext(
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
    const wrapper = mountWithAppContext(
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
    expect(wrapper.getAllByRole("textbox")[0]).toHaveDisplayValue("run-name-1");

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

    // Ensure the run item names are shown:
    expect(wrapper.getAllByRole("textbox")[1]).toHaveDisplayValue(
      "Provided run item name"
    );

    // Ensure quality controls are being displayed:
    expect(
      wrapper.container.querySelector('input[name="qualityControl-name-0"]')
    ).toHaveDisplayValue("test1");
    expect(
      wrapper.container.querySelector('input[name="qualityControl-name-1"]')
    ).toHaveDisplayValue("test2");
    expect(wrapper.getByText(/reserpine standard/i)).toBeInTheDocument();
    expect(wrapper.getByText(/acn blank/i)).toBeInTheDocument();

    // Expect Quality Control 1 to have 2 attachments (+1 for the sequence run attachment):
    expect(wrapper.getAllByRole("link", { name: /japan\.jpg/i }).length).toBe(
      3
    );

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
    const wrapper = mountWithAppContext(
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
    expect(wrapper.getAllByRole("textbox")[0]).toHaveDisplayValue("run-name-1");

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
    const wrapper = mountWithAppContext(<TestComponent />, testCtx);

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

    // Enter in names for the run items:
    userEvent.type(wrapper.getAllByRole("textbox")[1], "Run item name 1");
    userEvent.type(wrapper.getAllByRole("textbox")[2], "Run item name 2");

    // Type a name for the run to be created.
    userEvent.type(sequencingRunNameInput!, "My new run");

    // Add new quality control.
    userEvent.click(wrapper.getAllByRole("button", { name: "Add" })[0]);

    // Provide quality control
    userEvent.type(
      wrapper.getByTestId("qualityControl-name-0"),
      "Quality Control Test Name 1"
    );
    userEvent.click(wrapper.getAllByRole("combobox")[0]);
    userEvent.click(
      wrapper.getByRole("option", { name: /reserpine standard/i })
    );

    // Add an attachment to the quality control
    userEvent.click(
      wrapper.getAllByRole("button", { name: "Add Attachments" })[0]
    );
    userEvent.click(
      wrapper.getByRole("tab", { name: /attach existing objects/i })
    );

    // Wait for loading of the existing objects to attach...
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    userEvent.click(wrapper.getByRole("checkbox", { name: /select/i }));
    userEvent.click(wrapper.getByRole("button", { name: /attach selected/i }));

    // Wait for attachments to be displayed on the page.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Add another quality control.
    userEvent.click(wrapper.getAllByRole("button", { name: "Add" })[0]);

    // Provide quality control
    userEvent.type(
      wrapper.getByTestId("qualityControl-name-1"),
      "Quality Control Test Name 2"
    );
    userEvent.click(wrapper.getAllByRole("combobox")[1]);
    userEvent.click(
      wrapper.getByRole("option", { name: /reserpine standard/i })
    );

    // Click the save button.
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

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
              name: "Run item name 1",
              relationships: {
                run: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run"
                  }
                }
              },
              usageType:
                MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM,
              type: "molecular-analysis-run-item"
            },
            type: "molecular-analysis-run-item"
          },
          {
            resource: {
              name: "Run item name 2",
              relationships: {
                run: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run"
                  }
                }
              },
              usageType:
                MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM,
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
              usageType:
                MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM,
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
            id: "99ecc6fc-7378-4641-8914-1b9104e37b95",
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
            id: "169eafe4-44f2-407e-aa90-1a5483edf522",
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
            id: "9df16fe8-8510-4723-8f88-0a6bc0536624",
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
      ],

      // Quality control result
      [
        [
          {
            resource: {
              group: "aafc",
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
              type: "molecular-analysis-result"
            },
            type: "molecular-analysis-result"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      // Quality control run items creation
      [
        [
          {
            resource: {
              relationships: {
                result: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-result"
                  }
                },
                run: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run"
                  }
                }
              },
              type: "molecular-analysis-run-item",
              usageType: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL
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
              type: "molecular-analysis-run-item",
              usageType: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL
            },
            type: "molecular-analysis-run-item"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      // Quality control creation
      [
        [
          {
            resource: {
              group: "aafc",
              name: "Quality Control Test Name 1",
              qcType: "reserpine_standard",
              relationships: {
                molecularAnalysisRunItem: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run-item"
                  }
                }
              },
              type: "quality-control"
            },
            type: "quality-control"
          },
          {
            resource: {
              group: "aafc",
              name: "Quality Control Test Name 2",
              qcType: "reserpine_standard",
              relationships: {
                molecularAnalysisRunItem: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run-item"
                  }
                }
              },
              type: "quality-control"
            },
            type: "quality-control"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ]
    ]);
  });

  it("Run exists, in edit mode, update the existing run", async () => {
    const wrapper = mountWithAppContext(
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
    userEvent.clear(wrapper.getAllByRole("textbox")[0]);
    userEvent.type(wrapper.getAllByRole("textbox")[0], "Updated run name");

    // Add a new run name.
    userEvent.clear(wrapper.getAllByRole("textbox")[1]);
    userEvent.type(
      wrapper.getAllByRole("textbox")[1],
      "Update run item name 1"
    );
    userEvent.type(wrapper.getAllByRole("textbox")[2], "Add a new one");

    // Edit Quality Control 1
    userEvent.clear(wrapper.getAllByRole("textbox")[4]);
    userEvent.type(
      wrapper.getAllByRole("textbox")[4],
      "Updated Quality Control"
    );

    // Delete Quality Control 2
    expect(wrapper.queryByText(/acn blank/i)).toBeInTheDocument();
    userEvent.click(wrapper.getByTestId("delete-quality-control-1"));
    expect(wrapper.queryByText(/acn blank/i)).not.toBeInTheDocument();

    // Add new Quality Control
    userEvent.click(wrapper.getAllByRole("button", { name: "Add" })[0]);
    userEvent.type(wrapper.getAllByRole("textbox")[5], "New Quality Control");
    userEvent.click(wrapper.getAllByRole("combobox")[1]);
    userEvent.click(
      wrapper.getByRole("option", { name: /reserpine standard/i })
    );

    // Add blank quality control, should not be saved.
    userEvent.click(wrapper.getAllByRole("button", { name: "Add" })[0]);

    // Add an attachment to the existing quality control
    userEvent.click(
      wrapper.getAllByRole("button", { name: "Add Attachments" })[0]
    );
    userEvent.click(
      wrapper.getByRole("tab", { name: /attach existing objects/i })
    );

    await waitForElementToBeRemoved(wrapper.getAllByText(/loading\.\.\./i)[2]);

    userEvent.click(wrapper.getByRole("checkbox", { name: /select/i }));
    userEvent.click(wrapper.getByRole("button", { name: /attach selected/i }));

    // Add an attachment to the new quality control
    userEvent.click(
      wrapper.getAllByRole("button", { name: "Add Attachments" })[1]
    );
    userEvent.click(
      wrapper.getByRole("tab", { name: /attach existing objects/i })
    );

    await waitForElementToBeRemoved(wrapper.getAllByText(/loading\.\.\./i)[2]);

    userEvent.click(wrapper.getByRole("checkbox", { name: /select/i }));
    userEvent.click(wrapper.getByRole("button", { name: /attach selected/i }));

    // Click the save button.
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // No errors should be present at this point.
    expect(wrapper.queryByRole("alert")).not.toBeInTheDocument();
    expect(wrapper.queryByText(/edit mode: false/i)).toBeInTheDocument();

    // Expect the network request to only contain the update of the run.
    expect(mockSave.mock.calls).toEqual([
      // Updating the run
      [
        [
          {
            id: "5fee24e2-2ab1-4511-a6e6-4f8ef237f6c4",
            resource: {
              id: "5fee24e2-2ab1-4511-a6e6-4f8ef237f6c4",
              name: "Updated run name",
              type: "molecular-analysis-run"
            },
            type: "molecular-analysis-run"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      // Update the run item names
      [
        [
          {
            id: "f65ed036-eb92-40d9-af03-d027646e8948",
            resource: {
              id: "f65ed036-eb92-40d9-af03-d027646e8948",
              name: "Update run item name 1",
              type: "molecular-analysis-run-item"
            },
            type: "molecular-analysis-run-item"
          },
          {
            id: "021e1676-2eff-45e5-aed3-1c1b6cfece0a",
            resource: {
              id: "021e1676-2eff-45e5-aed3-1c1b6cfece0a",
              name: "Add a new one",
              type: "molecular-analysis-run-item"
            },
            type: "molecular-analysis-run-item"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      [
        [
          {
            resource: {
              group: "aafc",
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
              type: "molecular-analysis-result"
            },
            type: "molecular-analysis-result"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      // Create the brand new quality control run item.
      [
        [
          {
            resource: {
              relationships: {
                result: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-result"
                  }
                },
                run: {
                  data: {
                    id: "5fee24e2-2ab1-4511-a6e6-4f8ef237f6c4",
                    type: "molecular-analysis-run"
                  }
                }
              },
              type: "molecular-analysis-run-item",
              usageType: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL
            },
            type: "molecular-analysis-run-item"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      // Create the new quality control attached to the run item above.
      [
        [
          {
            resource: {
              group: "aafc",
              name: "New Quality Control",
              qcType: "reserpine_standard",
              relationships: {
                molecularAnalysisRunItem: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run-item"
                  }
                }
              },
              type: "quality-control"
            },
            type: "quality-control"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      // Update the existing quality control.
      [
        [
          {
            id: "0193b77e-eb54-77c0-84d1-ba64dba0c5e2",
            resource: {
              group: "aafc",
              id: "0193b77e-eb54-77c0-84d1-ba64dba0c5e2",
              name: "Updated Quality Control",
              qcType: "reserpine_standard",
              type: "quality-control"
            },
            type: "quality-control"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      // Now for the deleted quality control, first delete the quality control:
      [
        [
          {
            delete: {
              id: "0193b77e-eb77-7a28-9a0f-a18549bf7df8",
              type: "quality-control"
            }
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      // Delete the run item that was attached to the quality control.
      [
        [
          {
            delete: {
              id: "e9e39b72-ece7-454b-893a-2fc2d075e7b7",
              type: "molecular-analysis-run-item"
            }
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ]
    ]);
  });

  it("Run exists, in edit mode, delete quality control with existing attachments", async () => {
    const wrapper = mountWithAppContext(
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

    // Delete the quality control with existing attachments.
    userEvent.click(wrapper.getByTestId("delete-quality-control-0"));

    // Click the save button.
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // No errors should be present at this point.
    expect(wrapper.queryByRole("alert")).not.toBeInTheDocument();
    expect(wrapper.queryByText(/edit mode: false/i)).toBeInTheDocument();

    // Expect the network request to properly delete the quality control and attachments.
    expect(mockSave.mock.calls).toEqual([
      // Delete the quality control
      [
        [
          {
            delete: {
              id: "0193b77e-eb54-77c0-84d1-ba64dba0c5e2",
              type: "quality-control"
            }
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      // Delete the molecular analysis run item associated with the quality control.
      [
        [
          {
            delete: {
              id: "2a3b15ce-6781-466b-bc1e-49e35af3df58",
              type: "molecular-analysis-run-item"
            }
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      // Delete the molecular analysis result.
      [
        [
          {
            delete: {
              id: "cf1655f6-c6d4-484d-a8c4-5f328ccf645f",
              type: "molecular-analysis-result"
            }
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ]
    ]);
  });

  it("Run exists, in edit mode, Add another attachment to an existing quality control", async () => {
    const wrapper = mountWithAppContext(
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

    // Add an attachment to the first quality control (already contains attachments.)
    userEvent.click(
      wrapper.getAllByRole("button", { name: /add attachments/i })[0]
    );
    userEvent.click(
      wrapper.getByRole("tab", { name: /attach existing objects/i })
    );
    await waitForElementToBeRemoved(wrapper.getAllByText(/loading\.\.\./i)[0]);

    userEvent.click(wrapper.getByRole("checkbox", { name: /select/i }));
    userEvent.click(wrapper.getByRole("button", { name: /attach selected/i }));

    await waitForElementToBeRemoved(wrapper.getAllByText(/loading\.\.\./i)[0]);

    // Click the save button.
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // No errors should be present at this point.
    expect(wrapper.queryByRole("alert")).not.toBeInTheDocument();
    expect(wrapper.queryByText(/edit mode: false/i)).toBeInTheDocument();

    // Expect the network request to change the request to include all original 2 and the new
    // attachment.
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            id: "cf1655f6-c6d4-484d-a8c4-5f328ccf645f",
            resource: {
              id: "cf1655f6-c6d4-484d-a8c4-5f328ccf645f",
              relationships: {
                attachments: {
                  data: [
                    {
                      id: "7f3eccfa-3bc1-412f-9385-bb00e2319ac6",
                      type: "metadata"
                    },
                    {
                      id: "7f3eccfa-3bc1-412f-9385-bb00e2319ac6",
                      type: "metadata"
                    },
                    {
                      id: "7f3eccfa-3bc1-412f-9385-bb00e2319ac6",
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
        {
          apiBaseUrl: "/seqdb-api"
        }
      ]
    ]);
  });

  it("Create incomplete quality controls, report error message and remove completely empty quality controls", async () => {
    const wrapper = mountWithAppContext(
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

    // Create 4 new quality controls.
    for (let i = 0; i < 4; i++) {
      userEvent.click(wrapper.getAllByRole("button", { name: /add/i })[0]);
    }

    // Quality Control 1 - Both provided.
    userEvent.type(
      wrapper.getByTestId("qualityControl-name-0"),
      "both-provided"
    );
    userEvent.click(wrapper.getAllByRole("combobox")[0]);
    userEvent.click(
      wrapper.getByRole("option", { name: /reserpine standard/i })
    );

    // Quality Control 2 - Name only provided.
    userEvent.type(wrapper.getByTestId("qualityControl-name-1"), "name-only");

    // Quality Control 3 - Type only provided.
    userEvent.click(wrapper.getAllByRole("combobox")[2]);
    userEvent.click(
      wrapper.getByRole("option", { name: /reserpine standard/i })
    );

    // Save and expect an error message.
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(wrapper.queryByRole("alert")).toBeInTheDocument();
    });
    expect(wrapper.getByRole("alert").textContent).toEqual(
      "Please ensure all quality controls have both a name and type."
    );

    // Only 3 should exist, since 4 were created and one was blank and automatically removed.
    expect(wrapper.getAllByRole("combobox").length).toBe(3);
  });

  it("Automatically switch to edit mode and be able to cancel", async () => {
    const wrapper = mountWithAppContext(<TestComponent />, testCtx);

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
