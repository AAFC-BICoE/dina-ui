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
    type: "pcr-primer",
    name: "Primer 1"
  } as PersistedResource<PcrPrimer>,
  primerReverse: {
    id: "456",
    type: "pcr-primer",
    name: "Primer 2"
  } as PersistedResource<PcrPrimer>,
  experimenters: [
    { id: "1", type: "agent", displayName: "agent 1" },
    { id: "2", type: "agent", displayName: "agent 2" },
    { id: "3", type: "agent", displayName: "agent 3" }
  ] as any,
  attachment: [{ id: "attach-1", type: "metadata" }]
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
    case "seqdb-api/pcr-primer":
      return { data: [] };
    case "seqdb-api/thermocycler-profile":
      return { data: [] };
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map(path => {
    switch (path) {
      case "agent/1":
        return { id: "1", type: "agent", displayName: "agent 1" };
      case "agent/2":
        return { id: "2", type: "agent", displayName: "agent 2" };
      case "agent/3":
        return { id: "3", type: "agent", displayName: "agent 3" };
    }
  })
);

const mockSave = jest.fn(async ops => {
  return ops.map(({ resource }) => ({ ...resource, id: "123" }));
});

const mockOnSaved = jest.fn();

const apiContext = {
  apiClient: {
    get: mockGet
  },
  bulkGet: mockBulkGet,
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

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "test new batch" } });

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
            name: "test new batch",
            // TODO let the back-end set "createdBy" instead of the front-end:
            createdBy: "test-user",
            primerForward: undefined,
            primerReverse: undefined,
            type: "pcr-batch",
            relationships: {
              experimenters: {
                data: [
                  { id: "1", type: "person" },
                  { id: "2", type: "person" }
                ]
              },
              attachment: {
                data: []
              }
            }
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
            group: "cnc",
            id: "123",
            name: "test pcr batch",
            primerForward: {
              id: "123",
              type: "pcr-primer"
            },
            primerReverse: {
              id: "456",
              type: "pcr-primer"
            },
            type: "pcr-batch",
            relationships: {
              experimenters: {
                data: [
                  { id: "1", type: "person" },
                  { id: "2", type: "person" },
                  { id: "3", type: "person" }
                ]
              },
              attachment: {
                data: [{ id: "attach-1", type: "metadata" }]
              }
            }
          },
          type: "pcr-batch"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });
});
