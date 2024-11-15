import userEvent from "@testing-library/user-event";
import { mountWithAppContext2 } from "../../../../test-util/mock-app-context";
import {
  MolecularAnalysisDetailsStep,
  MolecularAnalysisDetailsStepProps
} from "../MolecularAnalysisDetailsStep";
import { PersistedResource } from "kitsu";
import { Group } from "packages/dina-ui/types/user-api";
import { Vocabulary } from "packages/dina-ui/types/collection-api";
import { useState, useEffect } from "react";
import "@testing-library/jest-dom";

const TEST_GROUP: PersistedResource<Group>[] = [
  {
    id: "31ee7848-b5c1-46e1-bbca-68006d9eda3b",
    type: "group",
    name: "Agriculture and Agri-food Canada",
    path: "",
    labels: { en: "AAFC", fr: "AAC" }
  }
];

const TEST_TYPES: PersistedResource<Vocabulary> = {
  id: "molecularAnalysisType",
  type: "vocabulary",
  vocabularyElements: [
    {
      key: "hrms",
      name: "HRMS",
      multilingualTitle: {
        titles: [
          { lang: "en", title: "High Resolution Mass Spectrometry (HRMS)" }
        ]
      }
    },
    {
      key: "gcms",
      name: "GCMS",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title:
              "Gas chromatography coupled to low-resolution mass spectrometry (GCMS)"
          }
        ]
      }
    }
  ]
};

const onSavedMock = jest.fn();
const mockSetEditMode = jest.fn();

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "user-api/group":
      return TEST_GROUP;
    case "seqdb-api/vocabulary/molecularAnalysisType":
      return { data: TEST_TYPES };
  }
});

const mockSave = jest.fn((ops) =>
  ops.map((op) => ({
    ...op.resource,
    id: op.resource.id ?? "123"
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
    save: mockSave
  }
} as any;

describe("Molecular Analysis Workflow - Step 1 - Molecular Analysis Details Step", () => {
  beforeEach(jest.clearAllMocks);

  function TestComponentWrapper(
    props: Partial<MolecularAnalysisDetailsStepProps>
  ) {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [performSave, setPerformSave] = useState<boolean>(false);

    useEffect(() => {
      mockSetEditMode(editMode);
    }, [editMode]);

    return (
      <>
        <p>Edit mode: {editMode ? "true" : "false"}</p>
        <button onClick={() => setEditMode(true)}>Edit</button>
        <button onClick={() => setEditMode(false)}>Cancel</button>

        <MolecularAnalysisDetailsStep
          onSaved={onSavedMock}
          performSave={performSave}
          setEditMode={setEditMode}
          setPerformSave={setPerformSave}
          {...props}
        />
      </>
    );
  }

  it("Create a new molecular analysis", async () => {
    const wrapper = mountWithAppContext2(
      <TestComponentWrapper
        genericMolecularAnalysis={undefined}
        genericMolecularAnalysisId={undefined}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Should automatically be in edit mode.
    expect(wrapper.getByText(/edit mode: true/i)).toBeInTheDocument();

    // Set the name for the new molecular analysis.
    userEvent.type(
      wrapper.getByRole("textbox", { name: /name/i }),
      "Test Molecular Analysis Name"
    );

    // Select the group using the dropdown.
    userEvent.click(
      wrapper.getByRole("combobox", { name: /group select\.\.\./i })
    );
    userEvent.click(wrapper.getByRole("option", { name: /aafc/i }));

    // Select the type of the molecular analysis.
    userEvent.click(
      wrapper.getByRole("combobox", { name: /analysis type select or type/i })
    );
    userEvent.click(
      wrapper.getByRole("option", {
        name: /high resolution mass spectrometry \(hrms\)/i
      })
    );

    // Perform save
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    // Expect the mock save to be called.
    expect(mockSave).toBeCalledWith(
      [
        {
          resource: {
            analysisType: "hrms",
            createdBy: "test-user",
            group: "aafc",
            name: "Test Molecular Analysis Name",
            type: "generic-molecular-analysis"
          },
          type: "generic-molecular-analysis"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });
});
