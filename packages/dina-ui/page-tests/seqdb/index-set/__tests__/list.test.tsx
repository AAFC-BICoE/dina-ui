import IndexSetListPage from "../../../../pages/seqdb/index-set/list";
import { mountWithAppContext2 } from "../../../../test-util/mock-app-context";
import { IndexSet } from "../../../../types/seqdb-api";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_INDEX_SETS: IndexSet[] = [
  {
    id: "1",
    name: "index set 1",
    type: "index-set"
  },
  {
    id: "2",
    name: "index set 2",
    type: "index-set"
  }
];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_INDEX_SETS
  };
});

const mockCtx = {
  apiClient: {
    get: mockGet
  }
};

function getWrapper() {
  return mountWithAppContext2(<IndexSetListPage />, {
    apiContext: mockCtx as any
  });
}

describe("Index set list page", () => {
  it("Renders the list page", async () => {
    const wrapper = getWrapper();

    // Wait for data to load:
    await new Promise(setImmediate);

    expect(wrapper.getByText(/index set 1/i)).toBeInTheDocument();
  });
});
