import { writeStorage } from "@rehooks/local-storage";
import { mountWithAppContext } from "common-ui";
import { DEFAULT_GROUP_STORAGE_KEY } from "../../group-select/useStoredDefaultGroup";
import { MaterialSampleGenerationForm } from "../MaterialSampleGenerationForm";
import { fireEvent, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/material-sample/test-parent-id":
      return {
        data: {
          id: "test-parent-id",
          type: "material-sample",
          materialSampleName: "test-sample",
          collection: {
            id: "100",
            type: "collection",
            name: "test-collection",
            code: "TC"
          }
        }
      };
    case "collection-api/collection":
      return {
        data: [
          {
            id: "100",
            type: "collection",
            name: "test-collection",
            code: "TC"
          }
        ]
      };
  }
});
const mockOnGenerate = jest.fn();

const testCtx = {
  apiContext: { apiClient: { get: mockGet } }
};

describe("MaterialSampleGenerationForm", () => {
  beforeEach(jest.clearAllMocks);

  beforeEach(() => {
    // Set the default group selection:
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "aafc");
    jest.clearAllMocks();
  });

  it("Generates the initial values for the new samples in series mode.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleGenerationForm onGenerate={mockOnGenerate} />,
      testCtx
    );
    await wrapper.waitForRequests();

    // Fill out the form
    // Change the collection
    userEvent.type(
      wrapper.getByRole("combobox", {
        name: /collection type here to search\./i
      }),
      "test-collection"
    );
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));
    fireEvent.click(
      wrapper.getByRole("option", { name: /test\-collection \(tc\)/i })
    );

    // Number to create
    fireEvent.change(
      wrapper.getByRole("spinbutton", { name: /material samples to create/i }),
      { target: { value: "5" } }
    );

    // Base name
    fireEvent.change(wrapper.getByRole("textbox", { name: /base name/i }), {
      target: { value: "my-sample" }
    });

    // Starting number
    fireEvent.change(wrapper.getByRole("textbox", { name: /start/i }), {
      target: { value: "00001" }
    });

    // Separator
    fireEvent.change(wrapper.getByRole("textbox", { name: /separator/i }), {
      target: { value: "-" }
    });

    // Source Set
    fireEvent.change(
      wrapper.getByRole("textbox", {
        name: "Source Set User-defined name that can be used to retrieve all material samples that were created in the same batch."
      }),
      { target: { value: "sourceSet1" } }
    );

    const expectedNames = [
      "my-sample-00001",
      "my-sample-00002",
      "my-sample-00003",
      "my-sample-00004",
      "my-sample-00005"
    ];

    // The default names should be in the placeholders:
    expectedNames.forEach((expectedName) =>
      expect(wrapper.getByPlaceholderText(expectedName)).toBeInTheDocument()
    );

    fireEvent.click(wrapper.getByRole("button", { name: /next/i }));
    await wrapper.waitForRequests();

    // Sample initialValues are created with the expected names and the linked collection:
    expect(mockOnGenerate).lastCalledWith({
      generationMode: "SERIES",
      samples: expectedNames.map((name) => ({
        parentMaterialSample: undefined,
        collection: {
          id: "100",
          code: "TC",
          name: "test-collection",
          type: "collection"
        },
        group: "aafc",
        sourceSet: "sourceSet1",
        materialSampleName: name,
        publiclyReleasable: true,
        type: "material-sample"
      })),
      submittedValues: {
        baseName: "my-sample",
        collection: {
          id: "100",
          name: "test-collection",
          code: "TC",
          type: "collection"
        },
        group: "aafc",
        increment: "NUMERICAL",
        numberToCreate: "5",
        sourceSet: "sourceSet1",
        samples: [],
        separator: "-",
        start: "00001",
        suffix: ""
      }
    });
  });
});
