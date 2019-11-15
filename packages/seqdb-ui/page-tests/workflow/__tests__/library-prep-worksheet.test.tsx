import { ApiClientContext, LoadingSpinner } from "common-ui";
import { mount } from "enzyme";
import { LibraryPrep, StepResource } from "types/seqdb-api";
import LibraryPrepWorksheetPage from "../../../pages/workflow/library-prep-worksheet";

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { stepResourceId: 5 } })
}));

const mockGet = jest.fn(async path => {
  if (path === "stepResource/5") {
    return {
      data: {
        chain: {
          id: "123",
          name: "test chain",
          type: "chain"
        },
        id: "5",
        libraryPrepBatch: {
          id: "200",
          name: "test batch",
          type: "libraryPrepBatch"
        },
        type: "stepResource"
      } as StepResource
    };
  }
  if (path === "libraryPrepBatch/200/libraryPreps") {
    return {
      data: [
        {
          id: "1",
          sample: { id: "1", type: "sample", name: "SAMP1" },
          type: "libraryPrep"
        },
        {
          id: "2",
          sample: { id: "1", type: "sample", name: "SAMP2" },
          type: "libraryPrep"
        },
        {
          id: "3",
          sample: { id: "1", type: "sample", name: "SAMP3" },
          type: "libraryPrep"
        }
      ] as LibraryPrep[]
    };
  }
  return { data: [] };
});

const mockCtx = {
  apiClient: {
    get: mockGet
  }
};

function getWrapper() {
  return mount(
    <ApiClientContext.Provider value={mockCtx as any}>
      <LibraryPrepWorksheetPage />
    </ApiClientContext.Provider>
  );
}

describe("Library Prep Worksheet page", () => {
  it("Renders the worksheet", async () => {
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
});
