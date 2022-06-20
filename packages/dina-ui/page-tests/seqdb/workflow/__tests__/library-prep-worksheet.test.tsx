import { ApiClientContext, LoadingSpinner } from "common-ui";
import LibraryPrepWorksheetPage from "../../../../pages/seqdb/workflow/library-prep-worksheet";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { LibraryPrep, StepResource } from "../../../../types/seqdb-api";

const mockUseRouter = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => mockUseRouter()
}));

const mockGet = jest.fn();
const mockCtx = {
  apiContext: {
    apiClient: {
      get: mockGet
    }
  }
};

function getWrapper() {
  return mountWithAppContext(<LibraryPrepWorksheetPage />, mockCtx);
}

describe("Library Prep Worksheet page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGet.mockImplementation(async path => {
      if (path === "seqdb-api/step-resource/5") {
        return {
          data: {
            chain: {
              id: "123",
              name: "test chain",
              type: "chain"
            },
            id: "5",
            libraryPrepBatch: {
              containerType: {
                baseType: "base type",
                id: "1",
                name: "container type",
                numberOfColumns: 12,
                numberOfRows: 8,
                type: "container-type"
              },
              id: "200",
              name: "test batch",
              type: "library-prep-batch"
            },
            type: "step-resource"
          } as StepResource
        };
      }
      if (path === "seqdb-api/library-prep-batch/200/libraryPreps") {
        return {
          data: [
            {
              id: "1",
              indexI5: { id: "1", type: "ngs-index", name: "index 1" },
              indexI7: { id: "4", type: "ngs-index", name: "index 4" },
              molecularSample: {
                id: "1",
                type: "molecular-sample",
                name: "SAMP1"
              },
              type: "library-prep",
              wellColumn: 1,
              wellRow: "A"
            },
            {
              id: "2",
              indexI5: { id: "2", type: "ngs-index", name: "index 2" },
              indexI7: { id: "5", type: "ngs-index", name: "index 5" },
              molecularSample: {
                id: "1",
                type: "molecular-sample",
                name: "SAMP2"
              },
              type: "library-prep",
              wellColumn: 2,
              wellRow: "A"
            },
            {
              id: "3",
              indexI5: { id: "3", type: "ngs-index", name: "index 3" },
              indexI7: { id: "6", type: "ngs-index", name: "index 6" },
              molecularSample: {
                id: "1",
                type: "molecular-sample",
                name: "SAMP3"
              },
              type: "library-prep",
              wellColumn: 2,
              wellRow: "A"
            }
          ] as LibraryPrep[]
        };
      }
      return { data: [] };
    });
  });

  it("Renders the worksheet with the sample table view.", async () => {
    mockUseRouter.mockImplementation(() => ({
      query: { stepResourceId: 5, sampleLayout: "table" }
    }));

    const wrapper = getWrapper();

    expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper.find("h2[children='Library Prep Worksheet']").exists()
    ).toEqual(true);

    // Chain name renders:
    expect(wrapper.find("input[defaultValue='test chain']").exists()).toEqual(
      true
    );

    // 3 library preps render:
    expect(wrapper.find("table.library-prep-table tbody tr").length).toEqual(3);
  });

  it("Renders the worksheet with the sample grid view.", async () => {
    mockUseRouter.mockImplementation(() => ({
      query: { stepResourceId: 5, sampleLayout: "grid" }
    }));

    const wrapper = getWrapper();

    expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);

    await new Promise(setImmediate);
    wrapper.update();

    // Check the olumn headers:
    expect(
      wrapper
        .find("table.library-prep-grid tr")
        .first()
        .find("td")
        .map(node => node.text())
    ).toEqual([
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

    // Check the row headers:
    expect(
      wrapper
        .find("table.library-prep-grid tr")
        .map(rowNode => rowNode.find("td").first().text())
    ).toEqual(["", "A", "B", "C", "D", "E", "F", "G", "H"]);

    // Make sure the indexes sho up in the grid:
    expect(
      wrapper
        .find("table.library-prep-grid tr")
        .at(1)
        .find("td")
        .map(node => node.text())
    ).toEqual([
      "A",
      "SAMP1i5: index 1i7: index 4",
      "SAMP3i5: index 3i7: index 6",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ]);
  });
});
