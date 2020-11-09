import { ApiClientContext } from "common-ui";
import { mount } from "enzyme";
import { mountWithAppContext } from "../../../../../test-util/mock-app-context";
import {
  Chain,
  ChainStepTemplate,
  Sample,
  StepResource
} from "../../../../../types/seqdb-api";
import { ContainerGrid } from "../ContainerGrid";
import { DraggableSampleBox } from "../DraggableSampleBox";
import { DraggableSampleList } from "../DraggableSampleList";
import { ContainerGridProps, SampleGrid } from "../SampleGrid";

const mockGet = jest.fn();
const mockSave = jest.fn();

const mockCtx = {
  apiClient: {
    get: mockGet
  },
  save: mockSave
};

function getWrapper(propsOverride?: Partial<ContainerGridProps>) {
  return mountWithAppContext(
    <SampleGrid
      libraryPrepBatch={{
        containerType: {
          baseType: "base type",
          id: "1",
          name: "96 well box",
          numberOfColumns: 12,
          numberOfRows: 8,
          type: "containerType"
        },
        id: "5",
        name: "test library prep batch",
        type: "libraryPrepBatch"
      }}
      chain={{ id: "5", type: "chain" } as Chain}
      sampleSelectionStep={
        { id: "1", type: "chainStepTemplate" } as ChainStepTemplate
      }
      {...propsOverride}
    />,
    { apiContext: mockCtx as any }
  );
}

const MOCK_LIBRARY_PREPS = [
  {
    id: "1",
    sample: { id: "2", name: "SAMP200", type: "sample" },
    type: "libraryPrep",
    wellColumn: 1,
    wellRow: "A"
  },
  {
    id: "2",
    sample: { id: "4", name: "SAMP400", type: "sample" },
    type: "libraryPrep",
    wellColumn: 2,
    wellRow: "B"
  },
  {
    id: "3",
    sample: { id: "6", name: "SAMP600", type: "sample" },
    type: "libraryPrep"
  }
];

const MOCK_STEPRESOURCES_NO_WELL_COORDS = [
  { sample: { id: "6", name: "SAMP600", type: "sample" } },
  { sample: { id: "10", name: "ZSAMP1000", type: "sample" } },
  { sample: { id: "8", name: "SAMP800", type: "sample" } }
] as StepResource[];

describe("SampleGrid component", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockGet.mockImplementation(async path => {
      // Mock the samples with libraryPreps:
      if (path === "seqdb-api/libraryPrepBatch/5/libraryPreps") {
        return {
          data: MOCK_LIBRARY_PREPS
        };
      }
      // Mock the samples without well coords:
      if (path === "seqdb-api/stepResource") {
        return {
          data: MOCK_STEPRESOURCES_NO_WELL_COORDS
        };
      }
    });

    mockSave.mockImplementation(async ops => {
      return ops.map(op => op.resource);
    });
  });

  it("Renders the grid based on the ContainerType.", async () => {
    const wrapper = getWrapper();

    // Should initially show the loading spinner.
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    await new Promise(setImmediate);
    wrapper.update();

    // There should be 12 columns
    expect(wrapper.find(".rt-th").map(node => node.text())).toEqual([
      "",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12"
    ]);

    // There should be 8 rows
    expect(
      wrapper
        .find(".rt-tbody .rt-tr")
        .map(node => node.find(".rt-td").first().text())
    ).toEqual(["A", "B", "C", "D", "E", "F", "G", "H"]);
  });

  it("Renders the sample list.", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper
        .find(".available-sample-list .list-group-item .sample-box-text")
        .map(node => node.text())
    ).toEqual(["SAMP600", "SAMP800", "ZSAMP1000"]);
  });

  it("Renders the sample names in the grid cells.", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    const rows = wrapper.find(".rt-tbody .rt-tr");

    // Expect the sample in 1A:
    expect(
      rows.first().find(".rt-td").at(1).find(".sample-box-text").text()
    ).toEqual("SAMP200");
    // Expect the sample in 2B:
    expect(
      rows.at(1).find(".rt-td").at(2).find(".sample-box-text").text()
    ).toEqual("SAMP400");
  });

  it("Lets you change the fill mode.", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    // Default should be "Column"
    expect(wrapper.find(".COLUMN-radio").prop("checked")).toEqual(true);

    // Change to row mode:
    wrapper.find(".ROW-radio").simulate("click");
    wrapper.update();

    expect(wrapper.find(".ROW-radio").prop("checked")).toEqual(true);
  });

  it("Lets you drag a sample from the list to the grid.", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(ContainerGrid).prop("onDrop")(
      MOCK_STEPRESOURCES_NO_WELL_COORDS[0].sample as Sample,
      "F_3"
    );

    wrapper.update();

    const gridCell = wrapper
      .find(".rt-tbody .rt-tr")
      .at(5)
      .find(".rt-td")
      .at(3);
    expect(gridCell.find(".sample-box-text").text()).toEqual("SAMP600");
    // The background color should be yellow:
    expect(gridCell.find("li").prop<any>("style").backgroundColor).toEqual(
      "#fff3cd"
    );

    // Submit the grid changes:
    wrapper.find(".grid-submit").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            id: "3",
            sample: expect.objectContaining({ id: "6", type: "sample" }),
            type: "libraryPrep",
            wellColumn: 3,
            wellRow: "F"
          },
          type: "libraryPrep"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });

  it("Lets you drag a sample from the grid to the list.", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    // Move SAMP200 to the list:
    wrapper.find(DraggableSampleList).prop("onDrop")(
      MOCK_LIBRARY_PREPS[0].sample as Sample
    );

    wrapper.update();

    // The sample should be back in the list and in the right alphanumeric
    // sample name order.
    expect(
      wrapper
        .find(".available-sample-list li .sample-box-text")
        .map(node => node.text())
    ).toEqual(["SAMP200", "SAMP600", "SAMP800", "ZSAMP1000"]);
  });

  it("Lets you fill multiple samples by Column.", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    // Select the first sample:
    wrapper.find(".available-sample-list li").first().prop<any>("onClick")({});
    wrapper.update();

    // Shift-click the third sample:
    wrapper.find(".available-sample-list li").at(2).prop<any>("onClick")({
      shiftKey: true
    });
    wrapper.update();

    // Move the selected samples:
    wrapper.find(ContainerGrid).prop("onDrop")(
      MOCK_STEPRESOURCES_NO_WELL_COORDS[0].sample as Sample,
      "G_3"
    );
    wrapper.update();

    expect(wrapper.find(".well-G_3 .sample-box-text").text()).toEqual(
      "SAMP600"
    );
    expect(wrapper.find(".well-H_3 .sample-box-text").text()).toEqual(
      "SAMP800"
    );
    expect(wrapper.find(".well-A_4 .sample-box-text").text()).toEqual(
      "ZSAMP1000"
    );

    // Submit the grid changes:
    wrapper.find(".grid-submit").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            id: "3",
            sample: expect.objectContaining({
              id: "6",
              type: "sample"
            }),
            type: "libraryPrep",
            wellColumn: 3,
            wellRow: "G"
          },
          type: "libraryPrep"
        },
        {
          resource: {
            libraryPrepBatch: expect.objectContaining({
              id: "5",
              type: "libraryPrepBatch"
            }),
            sample: expect.objectContaining({
              id: "8",
              type: "sample"
            }),
            type: "libraryPrep",
            wellColumn: 3,
            wellRow: "H"
          },
          type: "libraryPrep"
        },
        {
          resource: {
            libraryPrepBatch: expect.objectContaining({
              id: "5",
              type: "libraryPrepBatch"
            }),
            sample: expect.objectContaining({
              id: "10",
              type: "sample"
            }),
            type: "libraryPrep",
            wellColumn: 4,
            wellRow: "A"
          },
          type: "libraryPrep"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });

  it("Lets you fill multiple samples by Row.", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    // Change to row mode:
    wrapper.find(".ROW-radio").simulate("click");
    wrapper.update();

    // Select the first sample:
    wrapper.find(".available-sample-list li").first().prop<any>("onClick")({});
    wrapper.update();

    // Shift-click the third sample:
    wrapper.find(".available-sample-list li").at(2).prop<any>("onClick")({
      shiftKey: true
    });
    wrapper.update();

    // Move the selected samples:
    wrapper.find(ContainerGrid).prop("onDrop")(
      MOCK_STEPRESOURCES_NO_WELL_COORDS[0].sample as Sample,
      "G_11"
    );
    wrapper.update();

    // Submit the grid changes:
    wrapper.find(".grid-submit").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            id: "3",
            sample: expect.objectContaining({ id: "6", type: "sample" }),
            type: "libraryPrep",
            wellColumn: 11,
            wellRow: "G"
          },
          type: "libraryPrep"
        },
        {
          resource: {
            libraryPrepBatch: expect.objectContaining({
              id: "5",
              type: "libraryPrepBatch"
            }),
            sample: expect.objectContaining({ id: "8", type: "sample" }),
            type: "libraryPrep",
            wellColumn: 12,
            wellRow: "G"
          },
          type: "libraryPrep"
        },
        {
          resource: {
            libraryPrepBatch: expect.objectContaining({
              id: "5",
              type: "libraryPrepBatch"
            }),
            sample: expect.objectContaining({ id: "10", type: "sample" }),
            type: "libraryPrep",
            wellColumn: 1,
            wellRow: "H"
          },
          type: "libraryPrep"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });

  it("Provides a 'Clear Grid' button to clear the grid", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(".grid-clear").simulate("click");
    wrapper.update();

    // All 5 samples should be in the list, none in the grid:
    expect(wrapper.find(".available-sample-list li").length).toEqual(5);
    expect(wrapper.find(ContainerGrid).find(DraggableSampleBox).length).toEqual(
      0
    );
  });

  it("Provides a 'Move all' button to move all samples into the grid.", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(".move-all").simulate("click");
    wrapper.update();

    expect(wrapper.find(".available-sample-list li").length).toEqual(0);
    expect(wrapper.find(".well-A_1 .sample-box-text").text()).toEqual(
      "SAMP200"
    );
    expect(wrapper.find(".well-B_1 .sample-box-text").text()).toEqual(
      "SAMP400"
    );
    expect(wrapper.find(".well-C_1 .sample-box-text").text()).toEqual(
      "SAMP600"
    );
    expect(wrapper.find(".well-D_1 .sample-box-text").text()).toEqual(
      "SAMP800"
    );
    expect(wrapper.find(".well-E_1 .sample-box-text").text()).toEqual(
      "ZSAMP1000"
    );
  });

  it("Moves a sample back into the list if another sample is moved onto it.", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(ContainerGrid).prop("onDrop")(
      MOCK_STEPRESOURCES_NO_WELL_COORDS[2].sample as Sample,
      "A_1"
    );
    wrapper.update();

    // SAMP200 should have been moved back into the list.
    expect(
      wrapper
        .find(".available-sample-list li .sample-box-text[children='SAMP200']")
        .exists()
    ).toEqual(true);

    // SAMP800 should now be in the grid.
    expect(wrapper.find(".well-A_1 .sample-box-text").text()).toEqual(
      "SAMP800"
    );
  });

  it("Moves a sample back into the list if the move operation overflows into invalid well coordinates.", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    // Change to row mode:
    wrapper.find(".ROW-radio").simulate("click");
    wrapper.update();

    // Select the first sample:
    wrapper.find(".available-sample-list li").first().prop<any>("onClick")({});
    wrapper.update();

    // Shift-click the third sample:
    wrapper.find(".available-sample-list li").at(2).prop<any>("onClick")({
      shiftKey: true
    });
    wrapper.update();

    // Move the 3 selected samples, starting at the last cell:
    wrapper.find(ContainerGrid).prop("onDrop")(
      MOCK_STEPRESOURCES_NO_WELL_COORDS[0].sample as Sample,
      "H_12"
    );
    wrapper.update();

    // The 2 overflowed samples should be back in the available samples list:
    expect(
      wrapper
        .find(".available-sample-list .sample-box-text")
        .map(node => node.text())
    ).toEqual(["SAMP800", "ZSAMP1000"]);

    // Submit the grid changes:
    wrapper.find(".grid-submit").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // SAMP600 should be submitted in well H12. The other two samples should have null well coordinates.
    expect(mockSave).lastCalledWith(
      [
        {
          resource: expect.objectContaining({
            id: "3",
            sample: {
              id: "6",
              name: "SAMP600",
              type: "sample"
            },
            type: "libraryPrep",
            wellColumn: 12,
            wellRow: "H"
          }),
          type: "libraryPrep"
        },
        {
          resource: expect.objectContaining({
            sample: {
              id: "8",
              name: "SAMP800",
              type: "sample"
            },
            type: "libraryPrep",
            wellColumn: null,
            wellRow: null
          }),
          type: "libraryPrep"
        },
        {
          resource: expect.objectContaining({
            sample: {
              id: "10",
              name: "ZSAMP1000",
              type: "sample"
            },
            type: "libraryPrep",
            wellColumn: null,
            wellRow: null
          }),
          type: "libraryPrep"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });

  it("Shows a warning box if the Container Type is absent.", async () => {
    const wrapper = getWrapper({
      libraryPrepBatch: {
        id: "5",
        name: "test library prep batch",
        type: "libraryPrepBatch"
      }
    });

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".alert.alert-warning").text()).toEqual(
      "Container Type must be set to use the container grid."
    );
  });
});
