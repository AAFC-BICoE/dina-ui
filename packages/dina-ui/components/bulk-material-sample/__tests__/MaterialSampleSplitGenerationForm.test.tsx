import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { MaterialSampleSplitGenerationForm } from "../MaterialSampleSplitGenerationForm";

const NO_CHILDREN_MATERIAL_SAMPLE_UUID = "a503d31d-8203-4766-af85-db271e087853";

const NO_CHILDREN_MATERIAL_SAMPLE = {
  id: NO_CHILDREN_MATERIAL_SAMPLE_UUID,
  type: "material-sample",
  group: "aafc",
  materialSampleName: "CNC-1",
  materialSampleChildren: [],
  parentMaterialSample: undefined
};

const CHILDREN_MATERIAL_SAMPLE_UUID = "3a0ec067-6a98-4dba-8866-443237483a56";

const CHILDREN_MATERIAL_SAMPLE = {
  id: NO_CHILDREN_MATERIAL_SAMPLE_UUID,
  type: "material-sample",
  group: "aafc",
  materialSampleName: "CNC-2",
  materialSampleChildren: [
    {
      ordinal: 0,
      materialSampleName: "CNC-2-a"
    },
    {
      ordinal: 1,
      materialSampleName: "CNC-2-b"
    },
    {
      ordinal: 2,
      materialSampleName: "CNC-2-c"
    }
  ]
};

const mockOnGenerate = jest.fn();

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map((path) => {
    switch (path) {
      case `material-sample/${NO_CHILDREN_MATERIAL_SAMPLE_UUID}?include=materialSampleChildren,collection`:
        return NO_CHILDREN_MATERIAL_SAMPLE;
      case `material-sample/${CHILDREN_MATERIAL_SAMPLE_UUID}?include=materialSampleChildren,collection`:
        return CHILDREN_MATERIAL_SAMPLE;
      default:
        return {};
    }
  })
);

const mockSave = jest.fn();

const apiContext: any = { bulkGet: mockBulkGet, save: mockSave };

describe("MaterialSampleSplitGenerationForm", () => {
  beforeEach(() => jest.clearAllMocks);

  it("Layout snapshot", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleSplitGenerationForm
        onGenerate={mockOnGenerate}
        ids={[NO_CHILDREN_MATERIAL_SAMPLE_UUID]}
      />,
      { apiContext }
    );

    // Wait for the material sample request.
    await new Promise(setImmediate);
    wrapper.update();

    // This test is designed to simply ensure the design doesn't change when it's not expected.
    // If it's expected, the snapshot will need to be updated.
    expect(wrapper.find("main").debug()).toMatchSnapshot();
  });
});
