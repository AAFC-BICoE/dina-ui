import { mountWithAppContext } from "common-ui";
import { SangerRunStep, SangerRunStepProps } from "../SangerRunStep";
import { noop } from "lodash";
import {
  waitFor,
  waitForElementToBeRemoved,
  screen
} from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  MATERIAL_SAMPLE_SUMMARY_1,
  MATERIAL_SAMPLE_SUMMARY_2,
  MATERIAL_SAMPLE_SUMMARY_3,
  PCR_BATCH_ITEM_1,
  PCR_BATCH_ITEM_2,
  PCR_BATCH_ITEM_3,
  SEQ_BATCH,
  SEQ_BATCH_ID,
  SEQ_BATCH_ID_MULTIPLE_RUNS,
  SEQ_BATCH_NO_RUNS,
  SEQ_REACTIONS,
  SEQ_REACTIONS_MULTIPLE,
  SEQ_REACTIONS_NO_RUNS,
  STORAGE_UNIT_USAGE_1,
  STORAGE_UNIT_USAGE_2,
  STORAGE_UNIT_USAGE_3,
  TEST_METADATA,
  TEST_MOLECULAR_ANALYSIS_RUN,
  TEST_MOLECULAR_ANALYSIS_RUN_ID
} from "../__mocks__/SangerRunStepMocks";
import userEvent from "@testing-library/user-event";
import { useState, useEffect } from "react";
import { MolecularAnalysisRunItemUsageType } from "../../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "/seqdb-api/seq-reaction":
      switch (params.filter.rsql) {
        case "seqBatch.uuid==" + SEQ_BATCH_ID_MULTIPLE_RUNS:
          return SEQ_REACTIONS_MULTIPLE;
        case "seqBatch.uuid==" + SEQ_BATCH_ID:
          return SEQ_REACTIONS;
        case "seqBatch.uuid==" + SEQ_BATCH_NO_RUNS:
          return SEQ_REACTIONS_NO_RUNS;
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
      case "/storage-unit-usage/0192fd01-90a6-75a2-a7a3-daf1a4718471":
        return STORAGE_UNIT_USAGE_1;
      case "/storage-unit-usage/0192fd01-90c2-7e45-95a2-a5614f68052f":
        return STORAGE_UNIT_USAGE_2;
      case "/storage-unit-usage/0192fd01-9104-72fa-a18f-80d97da0c935":
        return STORAGE_UNIT_USAGE_3;

      // Pcr Batch Items
      case "/pcr-batch-item/7525c062-4af7-40de-ab16-e643241b215c?include=materialSample":
        return PCR_BATCH_ITEM_1;
      case "/pcr-batch-item/1ec0b67d-4810-4422-87ef-b521a1c61ed7?include=materialSample":
        return PCR_BATCH_ITEM_2;
      case "/pcr-batch-item/792114ca-86ad-46fe-807e-5a115d1a22d8?include=materialSample":
        return PCR_BATCH_ITEM_3;

      // Material Sample Summary
      case "/material-sample-summary/f1275d16-10d2-415b-91b8-3cd9c44a77a5":
        return MATERIAL_SAMPLE_SUMMARY_1;
      case "/material-sample-summary/ddf3c366-55e9-4c2e-8e5f-ea2ed5831cbf":
        return MATERIAL_SAMPLE_SUMMARY_2;
      case "/material-sample-summary/2308d337-756d-4714-90bb-57698b6f5819":
        return MATERIAL_SAMPLE_SUMMARY_3;

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

describe("Sanger Run Step from Sanger Workflow", () => {
  beforeEach(jest.clearAllMocks);

  it("Loading spinner is displayed on first load", async () => {
    const wrapper = mountWithAppContext(
      <SangerRunStep
        editMode={false}
        performSave={false}
        seqBatch={SEQ_BATCH}
        seqBatchId={SEQ_BATCH_ID}
        setEditMode={noop}
        setPerformSave={noop}
      />,
      testCtx
    );

    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Display the sequencing run in the UI", async () => {
    const wrapper = mountWithAppContext(
      <SangerRunStep
        editMode={true}
        performSave={false}
        seqBatch={SEQ_BATCH}
        seqBatchId={SEQ_BATCH_ID}
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
      wrapper.getByRole("link", { name: /sample1/i }).getAttribute("href")
    ).toEqual(
      "/collection/material-sample/view?id=f1275d16-10d2-415b-91b8-3cd9c44a77a5"
    );
    expect(
      wrapper.getByRole("link", { name: /sample2/i }).getAttribute("href")
    ).toEqual(
      "/collection/material-sample/view?id=ddf3c366-55e9-4c2e-8e5f-ea2ed5831cbf"
    );
    expect(
      wrapper.getByRole("link", { name: /sample3/i }).getAttribute("href")
    ).toEqual(
      "/collection/material-sample/view?id=2308d337-756d-4714-90bb-57698b6f5819"
    );

    // Primer name should be displayed.
    expect(
      wrapper.getByRole("cell", { name: /sample1 \(primer1\)/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("cell", { name: /sample2 \(primer1\)/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("cell", { name: /sample3 \(primer1\)/i })
    ).toBeInTheDocument();

    // Ensure Tube Number is rendered:
    expect(wrapper.getByRole("cell", { name: "1" })).toBeInTheDocument();
    expect(wrapper.getByRole("cell", { name: "2" })).toBeInTheDocument();
    expect(wrapper.getByRole("cell", { name: "3" })).toBeInTheDocument();

    // Ensure Well Coordinates is rendered:
    expect(wrapper.getByRole("cell", { name: "A1" })).toBeInTheDocument();
    expect(wrapper.getByRole("cell", { name: "A2" })).toBeInTheDocument();
    expect(wrapper.getByRole("cell", { name: "A3" })).toBeInTheDocument();

    // Ensure the run item names are shown:
    expect(wrapper.getAllByRole("textbox")[1]).toHaveDisplayValue(
      "Provided run item name"
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
      <SangerRunStep
        editMode={true}
        performSave={false}
        seqBatch={SEQ_BATCH}
        seqBatchId={SEQ_BATCH_ID_MULTIPLE_RUNS} // Use the SeqBatch ID with multiple runs
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
      wrapper.getByText(/multiple runs exist for this sanger workflow\./i)
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
  function TestComponent(props: Partial<SangerRunStepProps>) {
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

        <SangerRunStep
          editMode={editMode}
          performSave={performSave}
          seqBatch={SEQ_BATCH}
          seqBatchId={SEQ_BATCH_NO_RUNS}
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

    // Type a name for the run to be created.
    userEvent.type(sequencingRunNameInput!, "My new run");

    // Enter in names for the run items:
    userEvent.type(wrapper.getAllByRole("textbox")[1], "Run item name 1");
    userEvent.type(wrapper.getAllByRole("textbox")[2], "Run item name 2");

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
              name: "Run item name 1",
              relationships: {
                run: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run"
                  }
                }
              },
              usageType: MolecularAnalysisRunItemUsageType.SEQ_REACTION,
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
              usageType: MolecularAnalysisRunItemUsageType.SEQ_REACTION,
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
              usageType: MolecularAnalysisRunItemUsageType.SEQ_REACTION,
              type: "molecular-analysis-run-item"
            },
            type: "molecular-analysis-run-item"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ],

      // Seq Reaction Update
      [
        [
          {
            resource: {
              id: "1dae4ea0-e705-4d49-95c0-0a51dd047796",
              relationships: {
                molecularAnalysisRunItem: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run-item"
                  }
                }
              },
              type: "seq-reaction"
            },
            type: "seq-reaction"
          },
          {
            resource: {
              id: "55f2cee7-ebb9-44ac-9a2e-e7c8588567f9",
              relationships: {
                molecularAnalysisRunItem: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run-item"
                  }
                }
              },
              type: "seq-reaction"
            },
            type: "seq-reaction"
          },
          {
            resource: {
              id: "b5588dd1-ac88-4fd2-a484-2f467d9a6df5",
              relationships: {
                molecularAnalysisRunItem: {
                  data: {
                    id: "123",
                    type: "molecular-analysis-run-item"
                  }
                }
              },
              type: "seq-reaction"
            },
            type: "seq-reaction"
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
      <TestComponent seqBatchId={SEQ_BATCH_ID} />,
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

    // Update the two run iten name
    userEvent.clear(wrapper.getAllByRole("textbox")[1]);
    userEvent.type(wrapper.getAllByRole("textbox")[1], "Run item name 1");

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
              id: "00aca736-67c5-4258-9b7c-b3bb3c1f6b58",
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
      ],

      // Update the run item names
      [
        [
          {
            resource: {
              id: "cd8c4d28-586a-45c0-8f27-63030aba07cf",
              name: "Run item name 1",
              type: "molecular-analysis-run-item"
            },
            type: "molecular-analysis-run-item"
          }
        ],
        {
          apiBaseUrl: "/seqdb-api"
        }
      ]
    ]);
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
