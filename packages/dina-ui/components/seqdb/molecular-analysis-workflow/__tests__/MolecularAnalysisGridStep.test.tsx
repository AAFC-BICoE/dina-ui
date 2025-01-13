import { mountWithAppContext } from "common-ui";
import {
  MolecularAnalysisGridStep,
  MolecularAnalysisGridStepProps
} from "../MolecularAnalysisGridStep";
import {
  STORAGE_UNIT_USAGE_1,
  STORAGE_UNIT_USAGE_2,
  STORAGE_UNIT_USAGE_3,
  TEST_MATERIAL_SAMPLE_SUMMARY,
  TEST_MOLECULAR_ANALYSIS,
  TEST_MOLECULAR_ANALYSIS_ITEMS_WITHOUT_RUN,
  TEST_MOLECULAR_ANALYSIS_WITHOUT_RUN_ID,
  TEST_MOLECULAR_ANALYSIS_WITHOUT_STORAGE_ID,
  TEST_MOLECULAR_ANALYSIS_ITEMS_WITHOUT_STORAGE,
  TEST_STORAGE_UNIT_TYPES,
  TEST_MOLECULAR_ANALYSIS_MULTIPLE_STORAGE_ID,
  TEST_MOLECULAR_ANALYSIS_ITEMS_MULTIPLE_STORAGE,
  STORAGE_UNIT_USAGE_4
} from "../__mocks__/MolecularAnalysisMocks";
import "@testing-library/jest-dom";
import { waitForElementToBeRemoved } from "@testing-library/react";
import { useState, useEffect } from "react";
import userEvent from "@testing-library/user-event";

const onSavedMock = jest.fn();
const mockSetEditMode = jest.fn();
const mockSave = jest.fn();

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "/seqdb-api/generic-molecular-analysis-item":
      switch (params.filter.rsql) {
        case "genericMolecularAnalysis.uuid==" +
          TEST_MOLECULAR_ANALYSIS_WITHOUT_RUN_ID:
          return { data: TEST_MOLECULAR_ANALYSIS_ITEMS_WITHOUT_RUN };
        case "genericMolecularAnalysis.uuid==" +
          TEST_MOLECULAR_ANALYSIS_WITHOUT_STORAGE_ID:
          return { data: TEST_MOLECULAR_ANALYSIS_ITEMS_WITHOUT_STORAGE };
        case "genericMolecularAnalysis.uuid==" +
          TEST_MOLECULAR_ANALYSIS_MULTIPLE_STORAGE_ID:
          return { data: TEST_MOLECULAR_ANALYSIS_ITEMS_MULTIPLE_STORAGE };
      }
    case "collection-api/storage-unit-type":
      return { data: TEST_STORAGE_UNIT_TYPES };
    case "collection-api/storage-unit":
      return {
        data: [
          STORAGE_UNIT_USAGE_1.storageUnit,
          STORAGE_UNIT_USAGE_2.storageUnit,
          STORAGE_UNIT_USAGE_3.storageUnit
        ]
      };
  }
});

const mockBulkGet = jest.fn(async (paths) => {
  return paths.map((path: string) => {
    switch (path) {
      // Storage Unit Usage Requests
      case "/storage-unit-usage/" +
        STORAGE_UNIT_USAGE_1.id +
        "?include=storageUnit,storageUnit.storageUnitType":
        return STORAGE_UNIT_USAGE_1;
      case "/storage-unit-usage/" +
        STORAGE_UNIT_USAGE_2.id +
        "?include=storageUnit,storageUnit.storageUnitType":
        return STORAGE_UNIT_USAGE_2;
      case "/storage-unit-usage/" +
        STORAGE_UNIT_USAGE_3.id +
        "?include=storageUnit,storageUnit.storageUnitType":
        return STORAGE_UNIT_USAGE_3;
      case "/storage-unit-usage/" +
        STORAGE_UNIT_USAGE_4.id +
        "?include=storageUnit,storageUnit.storageUnitType":
        return STORAGE_UNIT_USAGE_4;

      // Material Sample Summary
      case "/material-sample-summary/" + TEST_MATERIAL_SAMPLE_SUMMARY[0].id:
        return TEST_MATERIAL_SAMPLE_SUMMARY[0];
      case "/material-sample-summary/" + TEST_MATERIAL_SAMPLE_SUMMARY[1].id:
        return TEST_MATERIAL_SAMPLE_SUMMARY[1];
      case "/material-sample-summary/" + TEST_MATERIAL_SAMPLE_SUMMARY[2].id:
        return TEST_MATERIAL_SAMPLE_SUMMARY[2];
    }
  });
});

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

describe("Molecular Analysis Workflow - Step 3 - Molecular Analysis Coordinate Selection Step", () => {
  beforeEach(jest.clearAllMocks);

  function TestComponentWrapper(
    props: Partial<MolecularAnalysisGridStepProps>
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
        <MolecularAnalysisGridStep
          editMode={editMode}
          performSave={performSave}
          molecularAnalysis={TEST_MOLECULAR_ANALYSIS}
          molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_WITHOUT_RUN_ID}
          setEditMode={setEditMode}
          setPerformSave={setPerformSave}
          onSaved={onSavedMock}
          {...props}
        />
      </>
    );
  }

  it("Loading spinner is displayed on first load", async () => {
    const wrapper = mountWithAppContext(<TestComponentWrapper />, testCtx);

    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Storage units exist, display them in view mode", async () => {
    const wrapper = mountWithAppContext(<TestComponentWrapper />, testCtx);

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Should not be in edit mode since storage units exist.
    expect(wrapper.getByText(/edit mode: false/i)).toBeInTheDocument();

    // Should see the storage unit type selected.
    expect(wrapper.getByText(/storage unit type name/i)).toBeInTheDocument();

    // Should see the storage unit selected.
    expect(wrapper.getByText(/storage unit type name/i)).toBeInTheDocument();

    // Everything should be in the grid based on the mocked data:
    expect(
      wrapper.getByText(/selected material samples \(0 in list\)/i)
    ).toBeInTheDocument();

    // Ensure Primary IDs are rendered in the grid with links:
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
    expect(
      wrapper.getByRole("link", { name: /sample 3/i }).getAttribute("href")
    ).toEqual(
      "/collection/material-sample/view?id=" +
        TEST_MATERIAL_SAMPLE_SUMMARY[2].id
    );

    // Switch into edit mode, skip button should not appear since storage units are linked currently.
    userEvent.click(wrapper.getByRole("button", { name: /edit/i }));
    expect(wrapper.getByText(/edit mode: true/i)).toBeInTheDocument();
    expect(
      wrapper.queryByRole("button", { name: /skip step/i })
    ).not.toBeInTheDocument();
  });

  it("Storage units don't exist, switch automatically into edit mode", async () => {
    const wrapper = mountWithAppContext(
      <TestComponentWrapper
        molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_WITHOUT_STORAGE_ID}
      />,
      testCtx
    );

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Should not be in edit mode since storage units exist.
    expect(wrapper.getByText(/edit mode: true/i)).toBeInTheDocument();

    // Skip button should be present here since no storage units exist yet.
    expect(
      wrapper.getByRole("button", { name: /skip step/i })
    ).toBeInTheDocument();

    // Change the dropdowns.
    userEvent.click(wrapper.getByRole("combobox"));
    userEvent.click(
      wrapper.getByRole("option", { name: /test storage unit type 1/i })
    );
    await new Promise(setImmediate);

    userEvent.click(wrapper.getAllByRole("combobox")[1]);
    userEvent.click(
      wrapper.getAllByRole("option", { name: /storage unit name/i })[0]
    );

    // Click cancel, nothing should be saved...
    userEvent.click(wrapper.getByRole("button", { name: /cancel/i }));

    // Expect nothing to be in the view since nothing was saved:
    expect(
      wrapper.getByText(
        /no coordinates have been saved yet, click "edit" to begin adding coordinates\./i
      )
    ).toBeInTheDocument();
  });

  it("Storage units don't exist, add storage coordinates for all material samples", async () => {
    const wrapper = mountWithAppContext(
      <TestComponentWrapper
        molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_WITHOUT_STORAGE_ID}
      />,
      testCtx
    );

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Should not be in edit mode since storage units exist.
    expect(wrapper.getByText(/edit mode: true/i)).toBeInTheDocument();

    // Change the dropdowns.
    userEvent.click(wrapper.getByRole("combobox"));
    userEvent.click(
      wrapper.getByRole("option", { name: /test storage unit type 1/i })
    );
    await new Promise(setImmediate);

    userEvent.click(wrapper.getAllByRole("combobox")[1]);
    userEvent.click(
      wrapper.getAllByRole("option", { name: /storage unit name/i })[0]
    );

    // 3 material samples should appear in the list, not in the grid yet.
    expect(
      wrapper.getByText(/selected material samples \(3 in list\)/i)
    ).toBeInTheDocument();

    // Fill by row, so it should have automatically selected the row option.
    expect(wrapper.getByRole("radio", { name: /row/i })).toHaveAttribute(
      "checked"
    );

    // Click the move all button.
    userEvent.click(wrapper.getByRole("button", { name: /move all/i }));

    // Save the new coordinates.
    userEvent.click(wrapper.getByRole("button", { name: /save selections/i }));
    await new Promise(setImmediate);

    // Expect the 3 API calls for the storage-unit-usages.
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: undefined,
              storageUnit: {
                id: "6f5f6d1c-69cc-49b1-b3ae-1675c18ef5b5",
                type: "storage-unit"
              },
              type: "storage-unit-usage",
              usageType: "generic-molecular-analysis-item",
              wellColumn: 1,
              wellRow: "A"
            },
            type: "storage-unit-usage"
          },
          {
            resource: {
              id: undefined,
              storageUnit: {
                id: "6f5f6d1c-69cc-49b1-b3ae-1675c18ef5b5",
                type: "storage-unit"
              },
              type: "storage-unit-usage",
              usageType: "generic-molecular-analysis-item",
              wellColumn: 2,
              wellRow: "A"
            },
            type: "storage-unit-usage"
          },
          {
            resource: {
              id: undefined,
              storageUnit: {
                id: "6f5f6d1c-69cc-49b1-b3ae-1675c18ef5b5",
                type: "storage-unit"
              },
              type: "storage-unit-usage",
              usageType: "generic-molecular-analysis-item",
              wellColumn: 3,
              wellRow: "A"
            },
            type: "storage-unit-usage"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ],
      [
        [
          {
            resource: {
              id: "99ecc6fc-7378-4641-8914-1b9104e37b95",
              relationships: {
                storageUnitUsage: {
                  data: null
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
                storageUnitUsage: {
                  data: null
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
                storageUnitUsage: {
                  data: null
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

  it("Storage units exist, remove existing storage unit usage", async () => {
    const wrapper = mountWithAppContext(<TestComponentWrapper />, testCtx);

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // All the material sample should be on the grid, not the list on the sidebar:
    expect(
      wrapper.getByText(/selected material samples \(0 in list\)/i)
    ).toBeInTheDocument();

    // Switch to edit mode.
    userEvent.click(wrapper.getByRole("button", { name: /edit/i }));

    // Clear the grid.
    userEvent.click(wrapper.getByRole("button", { name: /clear grid/i }));
    expect(
      wrapper.getByText(/selected material samples \(3 in list\)/i)
    ).toBeInTheDocument();

    // Save, should delete the 3 storage unit usages.
    userEvent.click(wrapper.getByRole("button", { name: /save selections/i }));
    await new Promise(setImmediate);

    // Update each generic-molecular-analysis-item to remove the storage unit usage relationship.
    // Then delete the storage unit usages.
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "99ecc6fc-7378-4641-8914-1b9104e37b95",
              relationships: {
                storageUnitUsage: {
                  data: null
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
                storageUnitUsage: {
                  data: null
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
                storageUnitUsage: {
                  data: null
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
      [
        [
          {
            delete: {
              id: "45ed6126-26b8-4ebd-a89f-1bbcf6c69d27",
              type: "storage-unit-usage"
            }
          },
          {
            delete: {
              id: "be81e29a-b634-43c7-8f1a-53bf394d87f2",
              type: "storage-unit-usage"
            }
          },
          {
            delete: {
              id: "0192fd01-9104-72fa-a18f-80d97da0c935",
              type: "storage-unit-usage"
            }
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ]
    ]);
  });

  it("Storage units exist, changing the storage unit type should clear the grid", async () => {
    const wrapper = mountWithAppContext(<TestComponentWrapper />, testCtx);

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Switch to edit mode.
    userEvent.click(wrapper.getByRole("button", { name: /edit/i }));

    // Change the storage unit type...
    userEvent.click(wrapper.getAllByRole("combobox")[0]);
    await new Promise(setImmediate);
    userEvent.click(
      wrapper.getByRole("option", { name: /test storage unit type 2/i })
    );

    // Expect a popup to ask are you sure you wish to change the storage unit type.
    expect(
      wrapper.getByText(
        /changing the storage unit type will clear the existing storage coordinates stored\./i
      )
    ).toBeInTheDocument();

    // Click proceed.
    userEvent.click(wrapper.getByRole("button", { name: /proceed/i }));
    await waitForElementToBeRemoved(wrapper.getAllByText(/loading\.\.\./i)[0]);

    userEvent.click(wrapper.getAllByRole("combobox")[1]);
    userEvent.click(
      wrapper.getAllByRole("option", { name: /storage unit name/i })[1]
    );

    // Expect the grid to be cleared automatically.
    expect(
      wrapper.getByText(/selected material samples \(3 in list\)/i)
    ).toBeInTheDocument();
  });

  it("Storage units exist, and multiple storage units are found, warning expected", async () => {
    const wrapper = mountWithAppContext(
      <TestComponentWrapper
        molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_MULTIPLE_STORAGE_ID}
      />,
      testCtx
    );

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Display a warning to the user.
    expect(
      wrapper.getByText(
        /multiple storage units have been found for the molecular analysis items\./i
      )
    ).toBeInTheDocument();

    // Switch to edit mode.
    userEvent.click(wrapper.getByRole("button", { name: /edit/i }));

    // Warning should still be displayed in edit mode.
    expect(
      wrapper.getByText(
        /multiple storage units have been found for the molecular analysis items\./i
      )
    ).toBeInTheDocument();
  });

  it("Storage units don't exist, attempt to use a storage unit type without grid support", async () => {
    const wrapper = mountWithAppContext(
      <TestComponentWrapper
        molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_WITHOUT_STORAGE_ID}
      />,
      testCtx
    );

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Should be in edit mode since no storage units exist.
    expect(wrapper.getByText(/edit mode: true/i)).toBeInTheDocument();

    // Change the dropdowns.
    userEvent.click(wrapper.getByRole("combobox"));
    userEvent.click(
      wrapper.getByRole("option", { name: /test storage unit type 3/i })
    );
    await new Promise(setImmediate);

    // Expect a warning message to appear since this storage unit type has not grid support.
    expect(
      wrapper.getByText(
        /the currently selected storage unit does not contain a container grid in order to use the storage selector\./i
      )
    ).toBeInTheDocument();
  });
});
