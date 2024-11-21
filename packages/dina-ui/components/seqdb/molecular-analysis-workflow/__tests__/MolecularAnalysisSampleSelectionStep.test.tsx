import { mountWithAppContext2 } from "../../../../test-util/mock-app-context";
import {
  MolecularAnalysisSampleSelectionStep,
  MolecularAnalysisSampleSelectionStepProps
} from "../MolecularAnalysisSampleSelectionStep";
import { useState, useEffect } from "react";
import { PersistedResource } from "kitsu";
import "@testing-library/jest-dom";
import { Group } from "packages/dina-ui/types/user-api";
import { screen, waitFor } from "@testing-library/react";
import { DinaForm } from "common-ui";
import userEvent from "@testing-library/user-event";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";

const TEST_MOLECULAR_ANALYSIS_EMPTY_ID = "62f25a7d-ebf5-469d-b3ef-f6f3269a6e23";

const TEST_MOLECULAR_ANALYSIS_EMPTY: PersistedResource<GenericMolecularAnalysis> =
  {
    id: TEST_MOLECULAR_ANALYSIS_EMPTY_ID,
    type: "generic-molecular-analysis",
    name: "empty generic molecular analysis",
    analysisType: "hrms",
    group: "aafc"
  };

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
  }
});

const mockSave = jest.fn((ops) =>
  ops.map((op) => ({
    ...op.resource,
    id: op.resource.id ?? "123"
  }))
);

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
    save: mockSave
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
});
