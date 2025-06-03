import userEvent from "@testing-library/user-event";
import { mountWithAppContext } from "common-ui";
import {
  MolecularAnalysisDetailsStep,
  MolecularAnalysisDetailsStepProps
} from "../MolecularAnalysisDetailsStep";
import { useState, useEffect } from "react";
import "@testing-library/jest-dom";
import {
  TEST_GROUP,
  TEST_MOLECULAR_ANALYSIS_TYPES,
  TEST_PROTOCOLS
} from "../__mocks__/MolecularAnalysisMocks";
import { waitFor } from "@testing-library/react";

const onSavedMock = jest.fn();
const mockSetEditMode = jest.fn();

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/protocol":
      return { data: TEST_PROTOCOLS };
    case "user-api/group":
      return TEST_GROUP;
    case "seqdb-api/vocabulary/molecularAnalysisType":
      return { data: TEST_MOLECULAR_ANALYSIS_TYPES };
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
          editMode={editMode}
          setEditMode={setEditMode}
          performSave={performSave}
          setPerformSave={setPerformSave}
          {...props}
        />
      </>
    );
  }

  it("Create a new molecular analysis", async () => {
    const wrapper = mountWithAppContext(
      <TestComponentWrapper
        genericMolecularAnalysis={undefined}
        genericMolecularAnalysisId={undefined}
      />,
      testCtx
    );

    // Should automatically be in edit mode.
    await waitFor(() => {
      expect(wrapper.getByText(/edit mode: true/i)).toBeInTheDocument();
    });

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

    // Select the protocol from the dropdown.
    userEvent.click(
      wrapper.getByRole("combobox", { name: /protocol type here to search\./i })
    );
    userEvent.click(wrapper.getByRole("option", { name: /protocol test 1/i }));

    // Perform save
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));

    // Expect the mock save to be called.
    await waitFor(() => {
      expect(mockSave).toBeCalledWith(
        [
          {
            resource: {
              analysisType: "hrms",
              createdBy: "test-user",
              group: "aafc",
              name: "Test Molecular Analysis Name",
              protocol: {
                id: "232f661a-bcd4-4ff2-8c6b-dace481b939a",
                name: "Protocol Test 1",
                type: "protocol"
              },
              type: "generic-molecular-analysis"
            },
            type: "generic-molecular-analysis"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      );
    });
  });

  it("Edit a existing molecular analysis", async () => {
    const wrapper = mountWithAppContext(
      <TestComponentWrapper
        genericMolecularAnalysis={{
          id: "be4a1145-377d-42c4-8ff3-93f2bc6db97b",
          name: "Existing Name",
          type: "generic-molecular-analysis",
          analysisType: "gcms",
          group: "aafc",
          createdBy: "test-user",
          createdOn: "2024-08-29",
          protocol: {
            id: "4faf8fdc-243b-42e8-b106-cf173da67f08",
            type: "protocol",
            name: "Protocol Test 2"
          }
        }}
        genericMolecularAnalysisId={"be4a1145-377d-42c4-8ff3-93f2bc6db97b"}
      />,
      testCtx
    );

    // Should not be in edit mode automatically.
    await waitFor(() => {
      expect(wrapper.getByText(/edit mode: false/i)).toBeInTheDocument();

      // Data should be displayed
      expect(wrapper.getByText(/existing name/i)).toBeInTheDocument();
      expect(wrapper.getByText(/aafc/i)).toBeInTheDocument();
      expect(
        wrapper.getByText(
          /gas chromatography coupled to low\-resolution mass spectrometry \(gcms\)/i
        )
      ).toBeInTheDocument();
      expect(
        wrapper.getByRole("link", { name: /protocol test 2/i })
      ).toBeInTheDocument();
      expect(wrapper.getByText(/test\-user/i)).toBeInTheDocument();
      expect(wrapper.getByText(/2024\-08\-29/i)).toBeInTheDocument();
    });

    // Switch into edit mode.
    userEvent.click(wrapper.getByRole("button", { name: /edit/i }));

    // Set the name for the new molecular analysis.
    userEvent.clear(wrapper.getByRole("textbox", { name: /name/i }));
    userEvent.type(
      wrapper.getByRole("textbox", { name: /name/i }),
      "New Molecular Analysis Name"
    );

    // Select the type of the molecular analysis.
    userEvent.click(
      wrapper.getByRole("combobox", {
        name: /analysis type gas chromatography coupled to low\-resolution mass spectrometry \(gcms\)/i
      })
    );
    userEvent.click(
      wrapper.getByRole("option", {
        name: /high resolution mass spectrometry \(hrms\)/i
      })
    );

    // Set the protocol to empty - remove the link.
    userEvent.click(
      wrapper.getByRole("combobox", { name: /protocol protocol test 2/i })
    );
    await waitFor(() => {
      expect(
        wrapper.getByRole("option", { name: /<none>/i })
      ).toBeInTheDocument();
    });
    userEvent.click(wrapper.getByRole("option", { name: /<none>/i }));

    // Perform save
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));

    // Expect the save request to contain the UUID and changes made.
    await waitFor(() => {
      expect(mockSave).toBeCalledWith(
        [
          {
            resource: {
              id: "be4a1145-377d-42c4-8ff3-93f2bc6db97b",
              analysisType: "hrms",
              createdBy: "test-user",
              createdOn: "2024-08-29",
              group: "aafc",
              name: "New Molecular Analysis Name",
              protocol: {
                id: null
              },
              type: "generic-molecular-analysis"
            },
            type: "generic-molecular-analysis"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      );
    });
  });
});
