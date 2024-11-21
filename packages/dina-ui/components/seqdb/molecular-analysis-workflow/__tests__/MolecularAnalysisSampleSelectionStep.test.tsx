import { mountWithAppContext2 } from "../../../../test-util/mock-app-context";
import {
  MolecularAnalysisSampleSelectionStep,
  MolecularAnalysisSampleSelectionStepProps
} from "../MolecularAnalysisSampleSelectionStep";
import { useState, useEffect } from "react";
import { PersistedResource } from "kitsu";
import "@testing-library/jest-dom";
import { Group } from "packages/dina-ui/types/user-api";
import { DinaForm } from "common-ui";
import userEvent from "@testing-library/user-event";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { GenericMolecularAnalysisItem } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysisItem";
import { MaterialSampleSummary } from "packages/dina-ui/types/collection-api";

const TEST_MOLECULAR_ANALYSIS_EMPTY_ID = "62f25a7d-ebf5-469d-b3ef-f6f3269a6e23";

const TEST_MOLECULAR_ANALYSIS_EMPTY: PersistedResource<GenericMolecularAnalysis> =
  {
    id: TEST_MOLECULAR_ANALYSIS_EMPTY_ID,
    type: "generic-molecular-analysis",
    name: "empty generic molecular analysis",
    analysisType: "hrms",
    group: "aafc"
  };

const TEST_MOLECULAR_ANALYSIS_RUN_ID = "5fee24e2-2ab1-4511-a6e6-4f8ef237f6c4";

const TEST_MOLECULAR_ANALYSIS_ID = "2a4fe193-28c7-499e-8eaf-26d7dc1fcd06";

const TEST_MOLECULAR_ANALYSIS: PersistedResource<GenericMolecularAnalysis> = {
  id: TEST_MOLECULAR_ANALYSIS_ID,
  type: "generic-molecular-analysis",
  name: "empty generic molecular analysis",
  analysisType: "hrms",
  group: "aafc"
};

const MATERIAL_SAMPLE_SUMMARY: PersistedResource<MaterialSampleSummary>[] = [
  {
    id: "01932b12-fa1a-74dc-b70c-453f55f42444",
    type: "material-sample-summary",
    materialSampleName: "Sample 1"
  },
  {
    id: "1182ca20-d3df-47e1-b27f-2a9cd9b6074f",
    type: "material-sample-summary",
    materialSampleName: "Sample 2"
  },
  {
    id: "239aaf35-9d02-409c-b099-987948cdcd63",
    type: "material-sample-summary",
    materialSampleName: "Sample 3"
  }
];

const TEST_MOLECULAR_ANALYSIS_ITEMS: PersistedResource<GenericMolecularAnalysisItem>[] =
  [
    {
      id: "99ecc6fc-7378-4641-8914-1b9104e37b95",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: MATERIAL_SAMPLE_SUMMARY[0],
      molecularAnalysisRunItem: {
        id: "f65ed036-eb92-40d9-af03-d027646e8948",
        type: "molecular-analysis-run-item",
        usageType: "hrms",
        run: {
          id: TEST_MOLECULAR_ANALYSIS_RUN_ID,
          type: "molecular-analysis-run"
        }
      },
      storageUnitUsage: {
        id: "45ed6126-26b8-4ebd-a89f-1bbcf6c69d27",
        type: "storage-unit-usage"
      }
    },
    {
      id: "169eafe4-44f2-407e-aa90-1a5483edf522",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: MATERIAL_SAMPLE_SUMMARY[1],
      molecularAnalysisRunItem: {
        id: "021e1676-2eff-45e5-aed3-1c1b6cfece0a",
        type: "molecular-analysis-run-item",
        usageType: "hrms",
        run: {
          id: TEST_MOLECULAR_ANALYSIS_RUN_ID,
          type: "molecular-analysis-run"
        }
      },
      storageUnitUsage: {
        id: "be81e29a-b634-43c7-8f1a-53bf394d87f2",
        type: "storage-unit-usage"
      }
    }
  ];

const TEST_GROUP: PersistedResource<Group>[] = [
  {
    id: "31ee7848-b5c1-46e1-bbca-68006d9eda3b",
    type: "group",
    name: "Agriculture and Agri-food Canada",
    path: "",
    labels: { en: "AAFC", fr: "AAC" }
  }
];

const TEST_MAPPING = {
  attributes: [
    {
      name: "materialSampleName",
      type: "text",
      fields: ["keyword"],
      path: "data.attributes"
    }
  ],
  relationships: [
    {
      referencedBy: "collectingEvent",
      name: "type",
      path: "included",
      value: "collecting-event",
      attributes: [
        {
          name: "dwcOtherRecordNumbers",
          type: "text",
          path: "attributes"
        }
      ]
    }
  ],
  index_name: "dina_material_sample_index"
};

const onSavedMock = jest.fn();
const mockSetEditMode = jest.fn();

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "/seqdb-api/generic-molecular-analysis-item":
      switch (params.filter.rsql) {
        case "genericMolecularAnalysis.uuid==" +
          TEST_MOLECULAR_ANALYSIS_EMPTY_ID:
          return { data: [] };
        case "genericMolecularAnalysis.uuid==" + TEST_MOLECULAR_ANALYSIS_ID:
          return { data: TEST_MOLECULAR_ANALYSIS_ITEMS };
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
    case "seqdb-api/generic-molecular-analysis/" + TEST_MOLECULAR_ANALYSIS_ID:
      return TEST_MOLECULAR_ANALYSIS;
  }
});

const mockBulkGet = jest.fn(async (paths) => {
  if (paths.length === 0) {
    return [];
  }
  return paths.map((path: string) => {
    return MATERIAL_SAMPLE_SUMMARY.find(
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
      return {
        data: {
          hits: {
            total: {
              relation: "eq",
              value: 3
            },
            hits: [
              {
                _source: {
                  data: {
                    relationships: {},
                    attributes: {
                      materialSampleName: "Sample 1"
                    },
                    id: "01932b12-fa1a-74dc-b70c-453f55f42444",
                    type: "material-sample"
                  }
                }
              },
              {
                _source: {
                  data: {
                    relationships: {},
                    attributes: {
                      materialSampleName: "Sample 2"
                    },
                    id: "1182ca20-d3df-47e1-b27f-2a9cd9b6074f",
                    type: "material-sample"
                  }
                }
              },
              {
                _source: {
                  data: {
                    relationships: {},
                    attributes: {
                      materialSampleName: "Sample 3"
                    },
                    id: "239aaf35-9d02-409c-b099-987948cdcd63",
                    type: "material-sample"
                  }
                }
              }
            ]
          }
        }
      };
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
    const wrapper = mountWithAppContext2(
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
    const wrapper = mountWithAppContext2(
      <TestComponentWrapper molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_ID} />,
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
                  id: MATERIAL_SAMPLE_SUMMARY[2].id, // Sample 3.
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
            id: TEST_MOLECULAR_ANALYSIS_ITEMS[1].id,
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
            id: TEST_MOLECULAR_ANALYSIS_ITEMS[1].storageUnitUsage?.id,
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
            id: TEST_MOLECULAR_ANALYSIS_ITEMS[1].molecularAnalysisRunItem?.id,
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
