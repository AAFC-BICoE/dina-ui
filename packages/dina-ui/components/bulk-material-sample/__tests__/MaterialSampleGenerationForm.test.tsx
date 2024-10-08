import { writeStorage } from "@rehooks/local-storage";
import { ResourceSelect } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { DEFAULT_GROUP_STORAGE_KEY } from "../../group-select/useStoredDefaultGroup";
import { MaterialSampleGenerationForm } from "../MaterialSampleGenerationForm";

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/material-sample/test-parent-id":
      return {
        data: {
          id: "test-parent-id",
          type: "material-sample",
          materialSampleName: "test-sample",
          collection: {
            id: "test-collection-id",
            type: "collection",
            name: "test-collection",
            code: "TC"
          }
        }
      };
    case "collection-api/collection":
      return { data: [] };
  }
});
const mockOnGenerate = jest.fn();

const testCtx = {
  apiContext: { apiClient: { get: mockGet } }
};

describe("MaterialSampleGenerationForm", () => {
  beforeEach(jest.clearAllMocks);

  beforeEach(() => {
    // Set the deault group selection:
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "aafc");
    jest.clearAllMocks();
  });

  it("Generates the initial values for the new samples in series mode.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleGenerationForm onGenerate={mockOnGenerate} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Fill out the form:
    wrapper
      .find(".collection-field")
      .find(ResourceSelect)
      .prop<any>("onChange")({
      id: "100",
      name: "test-collection",
      type: "collection"
    });
    wrapper
      .find(".numberToCreate-field input")
      .simulate("change", { target: { value: "5" } });
    wrapper
      .find(".baseName-field input")
      .simulate("change", { target: { value: "my-sample" } });
    wrapper
      .find(".start-field input")
      .simulate("change", { target: { value: "00001" } });
    wrapper
      .find(".separator-field input")
      .simulate("change", { target: { value: "-" } });
    wrapper
      .find(".sourceSet-field input")
      .simulate("change", { target: { value: "sourceSet1" } });

    const expectedNames = [
      "my-sample-00001",
      "my-sample-00002",
      "my-sample-00003",
      "my-sample-00004",
      "my-sample-00005"
    ];

    // The default names should be in the placeholders:
    expect(
      wrapper.find(".sample-name input").map((node) => node.prop("placeholder"))
    ).toEqual(expectedNames);

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Sample initialValues are created with the expected names and the linked collection:
    expect(mockOnGenerate).lastCalledWith({
      generationMode: "SERIES",
      samples: expectedNames.map((name) => ({
        parentMaterialSample: undefined,
        collection: { id: "100", name: "test-collection", type: "collection" },
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
