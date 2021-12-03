import { ResourceSelect } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { MaterialSampleGenerationForm } from "../MaterialSampleGenerationForm";
import Select from "react-select";

const mockGet = jest.fn<any, any>(async path => {
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
  it("Generated the initial values for the new samples.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleGenerationForm onGenerate={mockOnGenerate} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Use series mode:
    wrapper.find("li.series-tab").simulate("click");

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

    const expectedNames = [
      "my-sample-00001",
      "my-sample-00002",
      "my-sample-00003",
      "my-sample-00004",
      "my-sample-00005"
    ];

    // The default names should be in the placeholders:
    expect(
      wrapper.find(".sample-name input").map(node => node.prop("placeholder"))
    ).toEqual(expectedNames);

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Sample initialValues are created with the expected names and the linked collection:
    expect(mockOnGenerate).lastCalledWith(
      expectedNames.map(name => ({
        collection: { id: "100", name: "test-collection", type: "collection" },
        materialSampleName: name,
        type: "material-sample"
      }))
    );
  });

  it("Generates split samples from a parent sample.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleGenerationForm
        parentId={"test-parent-id"}
        onGenerate={mockOnGenerate}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Use series mode:
    wrapper.find("li.series-tab").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper.find(".collection-field").find(ResourceSelect).prop("value")
    ).toEqual({
      code: "TC",
      id: "test-collection-id",
      name: "test-collection",
      type: "collection"
    });
    expect(wrapper.find(".baseName-field input").prop("value")).toEqual(
      "test-sample"
    );

    // Fill out the form:
    wrapper
      .find(".numberToCreate-field input")
      .simulate("change", { target: { value: "5" } });
    wrapper
      .find(".separator-field input")
      .simulate("change", { target: { value: "-" } });
    // Use letter incrementation:
    wrapper.find(".increment-field").find(Select).prop<any>("onChange")({
      value: "LETTER"
    });
    wrapper
      .find(".start-field input")
      .simulate("change", { target: { value: "AA" } });

    // Generates the names in alphabet incrementation like Excel columns:
    const expectedNames = [
      "test-sample-AA",
      "test-sample-AB",
      "test-sample-AC",
      "test-sample-AD",
      "test-sample-AE"
    ];

    // The default names should be in the placeholders:
    expect(
      wrapper.find(".sample-name input").map(node => node.prop("placeholder"))
    ).toEqual(expectedNames);

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Sample initialValues are created with the expected names and the linked collection and parent sample:
    expect(mockOnGenerate).lastCalledWith(
      expectedNames.map(name => ({
        collection: expect.objectContaining({
          id: "test-collection-id",
          type: "collection"
        }),
        parentMaterialSample: { id: "test-parent-id", type: "material-sample" },
        materialSampleName: name,
        type: "material-sample"
      }))
    );
  });
});
