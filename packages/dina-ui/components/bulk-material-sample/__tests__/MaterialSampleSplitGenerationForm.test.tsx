import { SEPARATORS_DASH } from "../../../types/collection-api/resources/SplitConfiguration";
import { mountWithAppContext } from "common-ui";
import { MaterialSampleSplitGenerationForm } from "../MaterialSampleSplitGenerationForm";
import { waitForElementToBeRemoved } from "@testing-library/react";

const NO_CHILDREN_MATERIAL_SAMPLE_UUID = "a503d31d-8203-4766-af85-db271e087853";
const SPLIT_CONFIGURATION_UUID = "706eece4-3105-4e96-bc2f-7530a80a6163";

const NO_CHILDREN_MATERIAL_SAMPLE = {
  id: NO_CHILDREN_MATERIAL_SAMPLE_UUID,
  type: "material-sample",
  group: "aafc",
  materialSampleName: "CNC-1",
  materialSampleType: "WHOLE_ORGANISM",
  materialSampleChildren: [],
  parentMaterialSample: undefined
};

const mockOnGenerate = jest.fn();

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map((path) => {
    switch (path) {
      case `material-sample/${NO_CHILDREN_MATERIAL_SAMPLE_UUID}?include=materialSampleChildren,collection,parentMaterialSample`:
        return NO_CHILDREN_MATERIAL_SAMPLE;
      default:
        return {};
    }
  })
);

const mockSave = jest.fn((ops) =>
  ops.map((op) => ({
    ...op.resource,
    id: op.resource.id ?? "11111"
  }))
);

const mockGet = jest.fn(async (path) => {
  if (path === "collection-api/split-configuration") {
    return {
      data: {
        type: "split-configuration",
        characterType: "LOWER_LETTER",
        conditionalOnMaterialSampleTypes: ["WHOLE_ORGANISM"],
        id: SPLIT_CONFIGURATION_UUID,
        separator: SEPARATORS_DASH,
        name: "test-splitconfig",
        materialSampleTypeCreatedBySplit: "CULTURE_STRAIN",
        strategy: "DIRECT_PARENT"
      }
    };
  } else {
    return {};
  }
});

const apiContext: any = {
  bulkGet: mockBulkGet,
  save: mockSave,
  apiClient: { get: mockGet }
};

describe("MaterialSampleSplitGenerationForm", () => {
  beforeEach(() => jest.clearAllMocks);

  it("Layout snapshot with matching material sample types.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleSplitGenerationForm
        onGenerate={mockOnGenerate}
        ids={[NO_CHILDREN_MATERIAL_SAMPLE_UUID]}
        splitConfiguration={{
          type: "split-configuration",
          characterType: "LOWER_LETTER",
          conditionalOnMaterialSampleTypes: ["WHOLE_ORGANISM"],
          id: SPLIT_CONFIGURATION_UUID,
          separator: SEPARATORS_DASH,
          name: "test-splitconfig",
          materialSampleTypeCreatedBySplit: "CULTURE_STRAIN",
          strategy: "DIRECT_PARENT"
        }}
        splitConfigurationID={SPLIT_CONFIGURATION_UUID}
      />,
      { apiContext }
    );

    // Wait for the material sample request.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // This test is designed to simply ensure the design doesn't change when it's not expected.
    // If it's expected, the snapshot will need to be updated.
    expect(wrapper.asFragment()).toMatchSnapshot();
    wrapper.unmount();
  });

  it("Layout snapshot without matching material sample types.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleSplitGenerationForm
        onGenerate={mockOnGenerate}
        ids={[NO_CHILDREN_MATERIAL_SAMPLE_UUID]}
        splitConfiguration={{
          type: "split-configuration",
          characterType: "LOWER_LETTER",
          conditionalOnMaterialSampleTypes: ["CULTURE_STRAIN"],
          id: SPLIT_CONFIGURATION_UUID,
          separator: SEPARATORS_DASH,
          name: "test-splitconfig",
          materialSampleTypeCreatedBySplit: "CULTURE_STRAIN",
          strategy: "DIRECT_PARENT"
        }}
        splitConfigurationID={SPLIT_CONFIGURATION_UUID}
      />,
      { apiContext }
    );

    // Wait for the material sample request.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // This test is designed to simply ensure the design doesn't change when it's not expected.
    // If it's expected, the snapshot will need to be updated.
    expect(wrapper.asFragment()).toMatchSnapshot();
    wrapper.unmount();
  });
});
