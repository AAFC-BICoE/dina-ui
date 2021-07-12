import { ResourceSelect } from "common-ui";
import { mountWithAppContext } from "../../../../../../test-util/mock-app-context";
import { LibraryPrepBatch } from "../../../../../../types/seqdb-api";
import { IndexGrid, IndexGridProps } from "../IndexGrid";

const mockGet = jest.fn();
const mockSave = jest.fn();

const mockCtx = {
  apiClient: {
    get: mockGet
  },
  save: mockSave
};

const TEST_LIBRARY_PREP_BATCH: LibraryPrepBatch = {
  containerType: {
    baseType: "base type",
    id: "1",
    name: "container type",
    numberOfColumns: 12,
    numberOfRows: 8,
    type: "container-type"
  },
  id: "10",
  indexSet: { id: "123", name: "test index set", type: "index-set" },
  name: "test library prep batch",
  type: "library-prep-batch"
};

function getWrapper(propsOverride?: Partial<IndexGridProps>) {
  return mountWithAppContext(
    <IndexGrid libraryPrepBatch={TEST_LIBRARY_PREP_BATCH} {...propsOverride} />,
    { apiContext: mockCtx as any }
  );
}

// Wells 2B, 3B, 2C, 3C
const MOCK_LIBRARY_PREPS = [
  {
    id: "1",
    molecularSample: { id: "1", type: "molecular-sample", name: "SAMP1" },
    type: "library-prep",
    wellColumn: 2,
    wellRow: "B"
  },
  {
    id: "2",
    indexI5: { id: "1", type: "ngs-index", name: "test index 1" },
    indexI7: { id: "2", type: "ngs-index", name: "test index 2" },
    molecularSample: { id: "2", type: "molecular-sample", name: "SAMP2" },
    type: "library-prep",
    wellColumn: 3,
    wellRow: "B"
  },
  {
    id: "3",
    molecularSample: { id: "3", type: "molecular-sample", name: "SAMP3" },
    type: "library-prep",
    wellColumn: 2,
    wellRow: "C"
  },
  {
    id: "4",
    molecularSample: { id: "4", type: "molecular-sample", name: "SAMP4" },
    type: "library-prep",
    wellColumn: 3,
    wellRow: "C"
  }
];

describe("IndexGrid component", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockGet.mockImplementation(async path => {
      if (path === "seqdb-api/library-prep-batch/10/libraryPreps") {
        return { data: MOCK_LIBRARY_PREPS };
      }

      return { data: [] };
    });

    mockSave.mockImplementation(async ops => {
      return ops.map(op => op.resource);
    });
  });

  it("Renders the library preps in a grid.", async () => {
    const wrapper = getWrapper();

    // Renders initially with a loading indicator.
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper.find(".rt-tbody .rt-tr").at(1).find(".rt-td").at(2).text()
    ).toEqual("SAMP1");
    expect(
      wrapper.find(".rt-tbody .rt-tr").at(1).find(".rt-td").at(3).text()
    ).toEqual("SAMP2" + "i5: test index 1" + "i7: test index 2");
    expect(
      wrapper.find(".rt-tbody .rt-tr").at(2).find(".rt-td").at(3).text()
    ).toEqual("SAMP4");
  });

  it("Renders a warning message when the index set or container type is null.", async () => {
    const wrapper = getWrapper({
      libraryPrepBatch: {
        ...TEST_LIBRARY_PREP_BATCH,
        containerType: null,
        indexSet: null
      }
    });

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".alert.alert-warning").text()).toEqual(
      "Container Type and Index Set must be set to use the index grid."
    );
  });

  it("Lets you change the i5 and i7 indexes.", async () => {
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    // Change column 2's i7 values.
    wrapper
      .find(".rt-tr")
      .first()
      .find(".rt-th")
      .at(2)
      .find(ResourceSelect)
      .prop<any>("onChange")({ id: "100", name: "test ngs index 100" });

    // Change row C's i5 values.
    wrapper
      .find(".rt-tbody .rt-tr")
      .at(2)
      .find(".rt-td")
      .first()
      .find(ResourceSelect)
      .prop<any>("onChange")({ id: "200", name: "test ngs index 200" });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // 2B should be updated with i7 of ngs index 100.
    // 3B should be omitted from this operation because it is not in column 2 or row C.
    // 2C should be updated with i7 of ngs index 100 and i5 of ngs index 200.
    // 3C should be updated with i5 of ngs index 200.
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            id: "1",
            indexI7: {
              id: "100",
              type: "ngs-index"
            },
            type: "library-prep"
          },
          type: "library-prep"
        },
        {
          resource: {
            id: "3",
            indexI5: {
              id: "200",
              type: "ngs-index"
            },
            indexI7: {
              id: "100",
              type: "ngs-index"
            },
            type: "library-prep"
          },
          type: "library-prep"
        },
        {
          resource: {
            id: "4",
            indexI5: {
              id: "200",
              type: "ngs-index"
            },
            type: "library-prep"
          },
          type: "library-prep"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });
});
