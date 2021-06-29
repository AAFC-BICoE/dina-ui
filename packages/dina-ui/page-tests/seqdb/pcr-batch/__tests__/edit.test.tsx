import { PersistedResource } from "kitsu";
import { PcrBatchForm } from "../../../../pages/seqdb/pcr-batch/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { PcrBatch, PcrPrimer } from "../../../../types/seqdb-api";

const TEST_PCRBATCH: PersistedResource<PcrBatch> = {
  id: "123",
  type: "pcr-batch",
  name: "test pcr batch",
  group: "cnc",
  createdBy: "poffm",
  primerForward: {
    id: "123",
    type: "pcrPrimer",
    name: "Primer 1"
  } as PersistedResource<PcrPrimer>,
  primerReverse: {
    id: "456",
    type: "pcrPrimer",
    name: "Primer 2"
  } as PersistedResource<PcrPrimer>,
  experimenters: [
    { id: "1", type: "agent", displayName: "agent 1" },
    { id: "2", type: "agent", displayName: "agent 2" },
    { id: "3", type: "agent", displayName: "agent 3" }
  ] as any
};

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "seqdb-api/pcr-batch/123":
      return { data: TEST_PCRBATCH };
    case "user-api/group":
      return { data: [] };
    case "agent-api/person":
      return { data: [] };
    case "seqdb-api/region":
      return { data: [] };
    case "seqdb-api/pcrPrimer":
      return { data: [] };
  }
});

const mockSave = jest.fn(async ops => {
  return ops.map(({ resource }) => ({ ...resource, id: "123" }));
});

const mockOnSaved = jest.fn();

const apiContext = {
  apiClient: {
    get: mockGet
  },
  save: mockSave
};

describe("PcrBatch edit page", () => {
  beforeEach(jest.clearAllMocks);

  it("Adds a new pcr batch", async () => {
    const wrapper = mountWithAppContext(
      <PcrBatchForm onSaved={mockOnSaved} />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(".experimenters-field ResourceSelect").prop<any>("onChange")([
      {
        id: "1",
        type: "person"
      },
      {
        id: "2",
        type: "person"
      }
    ]);

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            // TODO let the back-end set "createdBy" instead of the front-end:
            createdBy: "test-user",
            experimenters: ["1", "2"],
            primerForward: undefined,
            primerReverse: undefined,
            type: "pcr-batch"
          },
          type: "pcr-batch"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });

  it("Edits an existing PCR Batch", async () => {
    const wrapper = mountWithAppContext(
      <PcrBatchForm pcrBatch={TEST_PCRBATCH} onSaved={mockOnSaved} />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            createdBy: "poffm",
            experimenters: ["1", "2", "3"],
            group: "cnc",
            id: "123",
            name: "test pcr batch",
            primerForward: {
              id: "123",
              name: "Primer 1",
              type: "pcrPrimer"
            },
            primerReverse: {
              id: "456",
              name: "Primer 2",
              type: "pcrPrimer"
            },
            type: "pcr-batch"
          },
          type: "pcr-batch"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });
});
