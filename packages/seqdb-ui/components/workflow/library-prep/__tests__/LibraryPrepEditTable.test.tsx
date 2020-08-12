import { ApiClientContext, ResourceSelect } from "common-ui";
import NumberFormat from "react-number-format";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Chain, ChainStepTemplate } from "../../../../types/seqdb-api";
import {
  LibraryPrepEditTable,
  LibraryPrepEditTableProps
} from "../LibraryPrepEditTable";

const mockGet = jest.fn();
const mockSave = jest.fn();

const mockCtx = {
  apiClient: {
    get: mockGet
  },
  save: mockSave
};

function getWrapper(propsOverride?: Partial<LibraryPrepEditTableProps>) {
  return mountWithAppContext(
    <LibraryPrepEditTable
      libraryPrepBatch={{
        containerType: {
          baseType: "base type",
          id: "1",
          name: "96 well box",
          numberOfColumns: 12,
          numberOfRows: 8,
          numberOfWells: 96,
          type: "containerType"
        },
        id: "5",
        indexSet: { id: "1234", name: "test index set", type: "indexSet" },
        name: "test library prep batch",
        type: "libraryPrepBatch"
      }}
      chain={{ id: "5", type: "chain" } as Chain}
      sampleSelectionStep={
        { id: "1", type: "chainStepTemplate" } as ChainStepTemplate
      }
      editMode="DETAILS"
      {...propsOverride}
    />,
    { apiContext: mockCtx as any }
  );
}

const MOCK_LIBRARY_PREPS = [
  {
    id: "3",
    indexI5: { id: "1", type: "ngsIndex", name: "i5 index 1" },
    inputNg: 123,
    sample: { id: "6", name: "SAMP600", type: "sample" },
    size: "big",
    type: "libraryPrep",
    wellColumn: 5,
    wellRow: "F"
  }
];

const MOCK_SAMPLE_STEPRESOURCES = [
  { sample: { id: "6", name: "SAMP600", type: "sample" } },
  { sample: { id: "10", name: "ZSAMP1000", type: "sample" } },
  { sample: { id: "8", name: "SAMP800", type: "sample" } }
];

describe("LibraryPrepEditTable component", () => {
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
          data: MOCK_SAMPLE_STEPRESOURCES
        };
      }

      return { data: [] };
    });

    mockSave.mockImplementation(async ops => {
      return ops.map(op => op.resource);
    });
  });

  it("Renders the library prep values.", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".rt-tbody .rt-tr").length).toEqual(3);

    expect((wrapper.find("input").first().instance() as any).value).toEqual(
      "123"
    );
  });

  it("Lets you add and edit library prep values.", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    // Change the first inputNg value.
    wrapper.find(NumberFormat).first().prop<any>("onValueChange")({
      floatValue: 999.999
    });

    // Change the third Quality value.
    wrapper
      .find(".rt-tbody .rt-tr")
      .at(2)
      .find("input")
      .at(1)
      .simulate("change", {
        target: {
          name: "sampleSrs[2].libraryPrep.quality-field",
          value: "very good"
        }
      });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Only the two edited library preps should be submitted:
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            id: "3",
            indexI5: {
              id: "1",
              name: "i5 index 1",
              type: "ngsIndex"
            },
            inputNg: 999.999,
            libraryPrepBatch: expect.objectContaining({
              id: "5",
              type: "libraryPrepBatch"
            }),
            sample: {
              id: "6",
              name: "SAMP600",
              type: "sample"
            },
            size: "big",
            type: "libraryPrep",
            wellColumn: 5,
            wellRow: "F"
          },
          type: "libraryPrep"
        },
        {
          resource: {
            libraryPrepBatch: expect.objectContaining({
              id: "5",
              type: "libraryPrepBatch"
            }),
            quality: "very good",
            sample: {
              id: "8",
              name: "SAMP800",
              type: "sample"
            }
          },
          type: "libraryPrep"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });

  it("Has an 'INDEX' mode that lets you edit ngs indexes.", async () => {
    const wrapper = getWrapper({ editMode: "INDEX" });

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(ResourceSelect).first().prop("value")).toEqual({
      id: "1",
      name: "i5 index 1",
      type: "ngsIndex"
    });

    // The well coordinate column text should be formatted as F05.
    expect(wrapper.find(".rt-tbody .rt-tr .rt-td").first().text()).toEqual(
      "F05"
    );

    wrapper
      .find(".rt-tbody .rt-tr")
      .at(2)
      .find(ResourceSelect)
      .first()
      .prop<any>("onChange")({
      id: "50",
      name: "i5 index 50",
      type: "ngsIndex"
    });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Only the edited library preps should be submitted:
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            indexI5: {
              id: "50",
              name: "i5 index 50",
              type: "ngsIndex"
            },
            libraryPrepBatch: expect.objectContaining({
              id: "5",
              type: "libraryPrepBatch"
            }),
            sample: {
              id: "8",
              name: "SAMP800",
              type: "sample"
            }
          },
          type: "libraryPrep"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });

  it("Should show a warning box if the index set or container type are null.", async () => {
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
      "Index set and container type must be set to edit library preps."
    );
  });
});
