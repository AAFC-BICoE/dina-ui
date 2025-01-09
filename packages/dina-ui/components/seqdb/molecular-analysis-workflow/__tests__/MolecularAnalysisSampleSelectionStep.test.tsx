import { mountWithAppContext } from "common-ui";
import {
  MolecularAnalysisSampleSelectionStep,
  MolecularAnalysisSampleSelectionStepProps
} from "../MolecularAnalysisSampleSelectionStep";
import { useState, useEffect } from "react";
import "@testing-library/jest-dom";
import { DinaForm } from "common-ui";
import userEvent from "@testing-library/user-event";
import {
  TEST_GROUP,
  TEST_MAPPING,
  TEST_MATERIAL_SAMPLE_SUMMARY,
  TEST_MOLECULAR_ANALYSIS,
  TEST_MOLECULAR_ANALYSIS_EMPTY,
  TEST_MOLECULAR_ANALYSIS_EMPTY_ID,
  TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID,
  TEST_MOLECULAR_ANALYSIS_ITEMS_WITH_RUN,
  TEST_MOLECULAR_ANALYSIS_RUN_ID,
  TEST_SEARCH_RESPONSE
} from "../__mocks__/MolecularAnalysisMocks";

const onSavedMock = jest.fn();
const mockSetEditMode = jest.fn();

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "/seqdb-api/generic-molecular-analysis-item":
      switch (params.filter.rsql) {
        case "genericMolecularAnalysis.uuid==" +
          TEST_MOLECULAR_ANALYSIS_EMPTY_ID:
          return { data: [] };
        case "genericMolecularAnalysis.uuid==" +
          TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID:
          return { data: TEST_MOLECULAR_ANALYSIS_ITEMS_WITH_RUN };
      }
    case "user-api/group":
      return TEST_GROUP;
    case "user-api/user-preference":
      return { data: [] };
    case "search-api/search-ws/mapping":
      return TEST_MAPPING;
    case "seqdb-api/generic-molecular-analysis/" +
      TEST_MOLECULAR_ANALYSIS_EMPTY_ID:
      return TEST_MOLECULAR_ANALYSIS_EMPTY;
    case "seqdb-api/generic-molecular-analysis/" +
      TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID:
      return TEST_MOLECULAR_ANALYSIS;
  }
});

const mockBulkGet = jest.fn(async (paths) => {
  if (paths.length === 0) {
    return [];
  }
  return paths.map((path: string) => {
    return TEST_MATERIAL_SAMPLE_SUMMARY.find(
      (sample) => "/material-sample-summary/" + sample.id === path
    );
  });
});

const mockSave = jest.fn(() => {
  return [
    {
      id: "123"
    }
  ];
});

const mockPost = jest.fn((post) => {
  switch (post) {
    case "search-api/search-ws/search":
      return TEST_SEARCH_RESPONSE;
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      axios: {
        get: mockGet,
        post: mockPost
      }
    },
    save: mockSave,
    bulkGet: mockBulkGet
  }
} as any;

describe("Molecular Analysis Workflow - Step 2 - Molecular Analysis Sample Selection Step", () => {
  beforeEach(jest.clearAllMocks);

  function TestComponentWrapper(
    props: Partial<MolecularAnalysisSampleSelectionStepProps>
  ) {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [performSave, setPerformSave] = useState<boolean>(false);

    useEffect(() => {
      mockSetEditMode(editMode);
    }, [editMode]);

    return (
      <>
        <p>Edit mode: {editMode ? "true" : "false"}</p>
        <p>Perform save: {performSave ? "true" : "false"}</p>
        <button onClick={() => setEditMode(true)}>Edit</button>
        <button onClick={() => setPerformSave(true)}>Save Selections</button>
        <button onClick={() => setEditMode(false)}>Cancel</button>
        <DinaForm initialValues={{}}>
          <MolecularAnalysisSampleSelectionStep
            onSaved={onSavedMock}
            editMode={editMode}
            setEditMode={setEditMode}
            performSave={performSave}
            setPerformSave={setPerformSave}
            molecularAnalysisId="5ac77b71-71f5-46b3-90f9-940629a7e035"
            {...props}
          />
        </DinaForm>
      </>
    );
  }

  it("New workflow, attach material samples", async () => {
    const wrapper = mountWithAppContext(
      <TestComponentWrapper
        molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_EMPTY_ID}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Should automatically be in edit mode since no material samples are linked yet.
    expect(wrapper.getByText(/edit mode: true/i)).toBeInTheDocument();

    // 3 records are expected from the mock elasticsearch response.
    expect(
      wrapper.container.querySelector("#queryPageCount")
    ).toHaveTextContent(/total matched records: 3/i);

    // The first checkbox is the select all in the header.
    userEvent.click(
      wrapper.getAllByRole("checkbox", { name: /check all/i })[0]
    );

    // Move the selected material samples over.
    userEvent.click(wrapper.getByTestId("move-resources-over"));

    // 3 records are expected in the selected table.
    expect(wrapper.getByText(/total selected records: 3/i)).toBeInTheDocument();

    // Perform save
    userEvent.click(wrapper.getByRole("button", { name: /save selections/i }));
    await new Promise(setImmediate);

    expect(mockSave).toBeCalledWith(
      [
        {
          resource: {
            createdBy: "test-user",
            genericMolecularAnalysis: {},
            relationships: {
              materialSample: {
                data: {
                  id: "01932b12-fa1a-74dc-b70c-453f55f42444",
                  type: "material-sample"
                }
              },
              molecularAnalysisRunItem: undefined
            },
            type: "generic-molecular-analysis-item"
          },
          type: "generic-molecular-analysis-item"
        },
        {
          resource: {
            createdBy: "test-user",
            genericMolecularAnalysis: {},
            relationships: {
              materialSample: {
                data: {
                  id: "1182ca20-d3df-47e1-b27f-2a9cd9b6074f",
                  type: "material-sample"
                }
              },
              molecularAnalysisRunItem: undefined
            },
            type: "generic-molecular-analysis-item"
          },
          type: "generic-molecular-analysis-item"
        },
        {
          resource: {
            createdBy: "test-user",
            genericMolecularAnalysis: {},
            relationships: {
              materialSample: {
                data: {
                  id: "239aaf35-9d02-409c-b099-987948cdcd63",
                  type: "material-sample"
                }
              },
              molecularAnalysisRunItem: undefined
            },
            type: "generic-molecular-analysis-item"
          },
          type: "generic-molecular-analysis-item"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });

  it("Existing workflow, attach new and remove existing material samples", async () => {
    const wrapper = mountWithAppContext(
      <TestComponentWrapper
        molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Should not automatically be in edit mode since material samples are linked already.
    expect(wrapper.getByText(/edit mode: false/i)).toBeInTheDocument();

    // 2 records are expected in the view table.
    expect(
      wrapper.container.querySelector("#queryPageCount")
    ).toHaveTextContent(/total matched records: 2/i);

    // Switch to edit mode.
    userEvent.click(wrapper.getByRole("button", { name: /edit/i }));
    await new Promise(setImmediate);
    expect(wrapper.getByText(/edit mode: true/i)).toBeInTheDocument();

    // Remove "Sample 2" from the currently selected list.
    userEvent.click(wrapper.getAllByRole("checkbox", { name: /select/i })[4]);
    userEvent.click(wrapper.getByTestId("remove-resources"));
    await new Promise(setImmediate);
    expect(wrapper.getByText(/total selected records: 1/i)).toBeInTheDocument();

    // Now add "Sample 3" to the selected list.
    userEvent.click(wrapper.getAllByRole("checkbox", { name: /select/i })[2]);
    userEvent.click(wrapper.getByTestId("move-resources-over"));
    await new Promise(setImmediate);
    expect(wrapper.getByText(/total selected records: 2/i)).toBeInTheDocument();

    // Perform save
    userEvent.click(wrapper.getByRole("button", { name: /save selections/i }));
    await new Promise(setImmediate);

    // Create a molecular-analysis-run-item since a run exists for this workflow.
    expect(mockSave.mock.calls[0]).toEqual([
      [
        {
          resource: {
            relationships: {
              run: {
                data: {
                  id: TEST_MOLECULAR_ANALYSIS_RUN_ID,
                  type: "molecular-analysis-run"
                }
              }
            },
            type: "molecular-analysis-run-item",
            usageType: "generic-molecular-analysis-item"
          },
          type: "molecular-analysis-run-item"
        }
      ],
      {
        apiBaseUrl: "/seqdb-api"
      }
    ]);

    // Create the generic-molecular-analysis-item for "Sample 3". Linked to the run item above.
    expect(mockSave.mock.calls[1]).toEqual([
      [
        {
          resource: {
            createdBy: "test-user",
            genericMolecularAnalysis: {},
            relationships: {
              materialSample: {
                data: {
                  id: TEST_MATERIAL_SAMPLE_SUMMARY[2].id, // Sample 3.
                  type: "material-sample"
                }
              },
              molecularAnalysisRunItem: {
                data: {
                  id: "123", // Linked to the one created above, id is mocked for creation.
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
    ]);

    // Delete "Sample 2" generic-molecular-analysis-item
    expect(mockSave.mock.calls[2]).toEqual([
      [
        {
          delete: {
            id: TEST_MOLECULAR_ANALYSIS_ITEMS_WITH_RUN[1].id,
            type: "generic-molecular-analysis-item"
          }
        }
      ],
      {
        apiBaseUrl: "/seqdb-api"
      }
    ]);

    // Storage unit usage should be deleted for "Sample 2".
    expect(mockSave.mock.calls[3]).toEqual([
      [
        {
          delete: {
            id: TEST_MOLECULAR_ANALYSIS_ITEMS_WITH_RUN[1].storageUnitUsage?.id,
            type: "storage-unit-usage"
          }
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    ]);

    // Delete the run item for "Sample 2".
    expect(mockSave.mock.calls[4]).toEqual([
      [
        {
          delete: {
            id: TEST_MOLECULAR_ANALYSIS_ITEMS_WITH_RUN[1]
              .molecularAnalysisRunItem?.id,
            type: "molecular-analysis-run-item"
          }
        }
      ],
      {
        apiBaseUrl: "/seqdb-api"
      }
    ]);
  });
});
