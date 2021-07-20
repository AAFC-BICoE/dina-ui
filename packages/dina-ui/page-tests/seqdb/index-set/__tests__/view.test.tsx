import { LoadingSpinner } from "common-ui";
import IndexSetViewPage from "../../../../pages/seqdb/index-set/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { IndexSet, NgsIndex } from "../../../../types/seqdb-api";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

// Pretend we are at the page for index set id#100
jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "100" } })
}));

const TEST_INDEX_SET: IndexSet = {
  id: "100",
  name: "test index set",
  type: "index-set"
};

const TEST_NGS_INDEXES: NgsIndex[] = [
  {
    id: "1",
    indexSet: { id: "100", type: "index-set" } as IndexSet,
    name: "index 1",
    type: "ngs-index"
  },
  {
    id: "2",
    indexSet: { id: "100", type: "index-set" } as IndexSet,
    name: "index 2",
    type: "ngs-index"
  },
  {
    id: "3",
    indexSet: { id: "100", type: "index-set" } as IndexSet,
    name: "index 3",
    type: "ngs-index"
  }
];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async path => {
  if (path === "seqdb-api/index-set/100") {
    return { data: TEST_INDEX_SET };
  }
  if (path === "seqdb-api/index-set/100/ngsIndexes") {
    return { data: TEST_NGS_INDEXES };
  }
  return { data: [] };
});

const mockCtx = {
  apiClient: {
    get: mockGet
  }
};

function getWrapper() {
  return mountWithAppContext(<IndexSetViewPage />, {
    apiContext: mockCtx as any
  });
}

describe("Index Set View Page", () => {
  it("Renders the index set view page.", async () => {
    const wrapper = getWrapper();

    // Renders initially with loading indicator:
    expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);

    // Wait for the page to load:
    await new Promise(setImmediate);
    wrapper.update();

    // The index set name is displayed:
    expect(
      wrapper.find(".field-view[children='test index set']").exists()
    ).toEqual(true);

    // Wait for the NGS indexes table to load:
    await new Promise(setImmediate);
    wrapper.update();
    // The table shows the ngs indexes:
    expect(wrapper.find(".rt-tbody .rt-td").first().text()).toEqual("index 1");
  });
});
