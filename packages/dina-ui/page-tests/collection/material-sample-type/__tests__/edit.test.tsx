import { PersistedResource } from "kitsu";
import { MaterialSampleTypeForm } from "../../../../pages/collection/material-sample-type/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { MaterialSampleType } from "../../../../types/collection-api";

const TEST_MST: PersistedResource<MaterialSampleType> = {
  id: "123",
  type: "material-sample-type",
  name: "test material sample type",
  group: "cnc"
};

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/material-sample-type/123":
      return { data: TEST_MST };
    case "user-api/group":
      return { data: [] };
  }
});

const mockSave = jest.fn(async ops => {
  return ops.map(({ resource }) => ({ ...resource, id: "123" }));
});

const mockOnSaved = jest.fn();

const apiContext = {
  apiClient: {
    get: mockGet
  },
  save: mockSave
};

describe("MaterialSampleTypeForm component", () => {
  it("Adds a new Material Sample Type", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleTypeForm onSaved={mockOnSaved} />,
      { apiContext }
    );

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "my-mst" } });

    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockOnSaved).lastCalledWith({
      id: "123",
      type: "material-sample-type",
      name: "my-mst"
    });
  });

  it("Edits an existing Material Sample Type", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleTypeForm
        fetchedMaterialSampleType={TEST_MST}
        onSaved={mockOnSaved}
      />,
      { apiContext }
    );

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "edited name" } });

    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockOnSaved).lastCalledWith({ ...TEST_MST, name: "edited name" });
  });
});
