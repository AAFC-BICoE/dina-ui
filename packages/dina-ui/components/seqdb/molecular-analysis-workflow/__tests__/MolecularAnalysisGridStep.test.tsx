import { mountWithAppContext2 } from "../../../../../dina-ui/test-util/mock-app-context";
import {
  MolecularAnalysisGridStep,
  MolecularAnalysisGridStepProps
} from "../MolecularAnalysisGridStep";
import { noop } from "lodash";
import {
  STORAGE_UNIT_USAGE_1,
  STORAGE_UNIT_USAGE_2,
  STORAGE_UNIT_USAGE_3,
  TEST_MATERIAL_SAMPLE_SUMMARY,
  TEST_MOLECULAR_ANALYSIS,
  TEST_MOLECULAR_ANALYSIS_ITEMS_WITHOUT_RUN,
  TEST_MOLECULAR_ANALYSIS_WITHOUT_RUN_ID
} from "../__mocks__/MolecularAnalysisMocks";
import "@testing-library/jest-dom";
import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import { useState, useEffect } from "react";

const onSavedMock = jest.fn();
const mockSetEditMode = jest.fn();

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "/seqdb-api/generic-molecular-analysis-item":
      switch (params.filter.rsql) {
        case "genericMolecularAnalysis.uuid==" +
          TEST_MOLECULAR_ANALYSIS_WITHOUT_RUN_ID:
          return { data: TEST_MOLECULAR_ANALYSIS_ITEMS_WITHOUT_RUN };
      }
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
    bulkGet: mockBulkGet
    // save: mockSave
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
          editMode={false}
          performSave={false}
          molecularAnalysis={TEST_MOLECULAR_ANALYSIS}
          molecularAnalysisId={TEST_MOLECULAR_ANALYSIS_WITHOUT_RUN_ID}
          setEditMode={noop}
          setPerformSave={noop}
          onSaved={onSavedMock}
          {...props}
        />
      </>
    );
  }

  it("Loading spinner is displayed on first load", async () => {
    const wrapper = mountWithAppContext2(<TestComponentWrapper />, testCtx);

    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Storage units exist, display them in view mode", async () => {
    const wrapper = mountWithAppContext2(<TestComponentWrapper />, testCtx);

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
  });
});
