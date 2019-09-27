import { ApiClientContext } from "components/api-client/ApiClientContext";
import { mount } from "enzyme";
import { Chain, ChainStepTemplate } from "../../../../../types/seqdb-api";
import { SampleGrid } from "../SampleGrid";

const mockGet = jest.fn();

const mockCtx = {
  apiClient: {
    get: mockGet
  }
};

function getWrapper() {
  return mount(
    <ApiClientContext.Provider value={mockCtx as any}>
      <SampleGrid
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
          type: "libraryPrepBatch"
        }}
        chain={{ id: "5", type: "chain" } as Chain}
        sampleSelectionStep={
          { id: "1", type: "chainStepTemplate" } as ChainStepTemplate
        }
      />
    </ApiClientContext.Provider>
  );
}

describe("SampleGrid component", () => {
  it("Renders the initial list and grid.", () => {
    getWrapper();
  });
});
