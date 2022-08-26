import { PersistedResource } from "kitsu";
import { MolecularSampleForm } from "../../../../pages/seqdb/molecular-sample/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { MolecularSample } from "../../../../types/seqdb-api";

const TEST_MOLECULAR_SAMPLE: PersistedResource<MolecularSample> = {
  id: "123",
  type: "molecular-sample",
  name: "test molecular sample",
  group: "cnc",
  materialSample: {
    id: "999",
    type: "material-sample",
    materialSampleName: "test-mst"
  }
};

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "seqdb-api/molecular-sample/123":
      return { data: TEST_MOLECULAR_SAMPLE };
    case "user-api/group":
      return { data: [] };
    case "collection-api/material-sample":
      return { data: [] };
    case "seqdb-api/product":
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

describe("MolecularSampleForm", () => {
  it("Adds a new molecular sample", async () => {
    const wrapper = mountWithAppContext(
      <MolecularSampleForm onSaved={mockOnSaved} />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "my-molecular-sample" } });
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            name: "my-molecular-sample",
            type: "molecular-sample"
          },
          type: "molecular-sample"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });

  it("Edits an existing molecular sample", async () => {
    const wrapper = mountWithAppContext(
      <MolecularSampleForm
        molecularSample={TEST_MOLECULAR_SAMPLE}
        onSaved={mockOnSaved}
      />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            name: "test molecular sample",
            group: "cnc",
            id: "123",
            materialSample: {
              id: "999",
              materialSampleName: "test-mst",
              type: "material-sample"
            },
            type: "molecular-sample"
          },
          type: "molecular-sample"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });
});
