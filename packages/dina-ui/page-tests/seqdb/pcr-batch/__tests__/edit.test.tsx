import { waitFor, fireEvent } from "@testing-library/react";
import { PersistedResource } from "kitsu";
import { PcrBatchForm } from "../../../../pages/seqdb/pcr-batch/edit";
import { mountWithAppContext } from "common-ui";
import { PcrBatch, PcrPrimer } from "../../../../types/seqdb-api";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

// UUID test data:
const PCR_BATCH_UUID = "91a4b3ba-b8e6-4178-953d-79d12f75bcd7";
const FORWARD_PRIMER_UUID = "c48329ba-6b05-439d-9e03-cb4841996b07";
const REVERSE_PRIMER_UUID = "743e0721-352e-4a39-a1a8-415a95f8cb77";
const STORAGE_UNIT_TYPE_UUID = "6ecf75aa-5ba9-4ea9-a06f-85fb33651ca6";
const STORAGE_UNIT_UUID = "77a17a6b-a075-4ace-b9cc-e08dcb6c3ae4";
const AGENT_1_UUID = "fe0ababf-156a-4537-8ade-e3fef3090e39";
const AGENT_2_UUID = "11f54bdf-d809-4099-8960-11eabeabfe06";
const AGENT_3_UUID = "59109a3e-07e7-400c-8e9d-1c57ddc35a8f";
const ATTACHMENT_UUID = "9878c096-b76e-4969-b4f2-dbb4a7f0cdd2";

const TEST_PCRBATCH: PersistedResource<PcrBatch> = {
  id: PCR_BATCH_UUID,
  type: "pcr-batch",
  name: "test pcr batch",
  group: "cnc",
  isCompleted: false,
  createdBy: "poffm",
  primerForward: {
    id: FORWARD_PRIMER_UUID,
    type: "pcr-primer",
    name: "Primer 1"
  } as PersistedResource<PcrPrimer>,
  primerReverse: {
    id: REVERSE_PRIMER_UUID,
    type: "pcr-primer",
    name: "Primer 2"
  } as PersistedResource<PcrPrimer>,
  experimenters: [
    { id: AGENT_1_UUID, type: "agent", displayName: "agent 1" },
    { id: AGENT_2_UUID, type: "agent", displayName: "agent 2" },
    { id: AGENT_3_UUID, type: "agent", displayName: "agent 3" }
  ] as any,
  attachment: [{ id: ATTACHMENT_UUID, type: "metadata" }]
};

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "agent-api/person":
      return {
        data: [
          { id: AGENT_1_UUID, type: "person", displayName: "person 1" },
          { id: AGENT_2_UUID, type: "person", displayName: "person 2" }
        ]
      };
    case "seqdb-api/pcr-batch/" + PCR_BATCH_UUID:
      return { data: TEST_PCRBATCH };
    case "user-api/group":
    case "seqdb-api/region":
    case "seqdb-api/pcr-primer":
    case "seqdb-api/pcr-batch-item":
    case "seqdb-api/thermocycler-profile":
    case "objectstore-api/metadata":
      return { data: [] };
    case "collection-api/storage-unit":
      return {
        data: [
          {
            id: STORAGE_UNIT_UUID,
            type: "storage-unit"
          }
        ]
      };
    case "collection-api/storage-unit-type":
      return {
        data: [
          {
            id: STORAGE_UNIT_TYPE_UUID,
            type: "storage-unit-type"
          }
        ]
      };
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map((path) => {
    switch (path) {
      case "agent/" + AGENT_1_UUID:
        return { id: AGENT_1_UUID, type: "agent", displayName: "agent 1" };
      case "agent/" + AGENT_2_UUID:
        return { id: AGENT_2_UUID, type: "agent", displayName: "agent 2" };
      case "agent/" + AGENT_3_UUID:
        return { id: AGENT_3_UUID, type: "agent", displayName: "agent 3" };
      case "storage-unit-type/" + STORAGE_UNIT_TYPE_UUID:
        return {
          data: {
            id: STORAGE_UNIT_TYPE_UUID,
            type: "storage-unit-type",
            attributes: {
              name: "Test Storage Unit Type"
            }
          }
        };
      case "storage-unit/" + STORAGE_UNIT_UUID:
        return {
          data: {
            id: STORAGE_UNIT_UUID,
            type: "storage-unit",
            attributes: {
              name: "Test Storage Unit"
            }
          }
        };
    }
  })
);

const mockSave = jest.fn(async (ops) => {
  return ops.map(({ resource }) => ({ ...resource, id: PCR_BATCH_UUID }));
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

    await wrapper.waitForRequests();

    // Change textbox value to "test new batch"
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: { value: "test new batch" }
    });

    // Select person 1 from Experimenters Combo Box
    userEvent.click(wrapper.getByRole("combobox", { name: /experimenters/i }));
    userEvent.click(wrapper.getByRole("option", { name: /person 1/i }));
    // Select person 2 from Experimenters Combo Box
    userEvent.click(
      wrapper.getByRole("combobox", { name: /experimenters person 1/i })
    );
    userEvent.click(wrapper.getByRole("option", { name: /person 2/i }));

    await wrapper.waitForRequests();

    // Submit Form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test for expected API Response
    await waitFor(() =>
      expect(mockSave).toHaveBeenCalledWith(
        [
          {
            resource: {
              createdBy: "test-user",
              name: "test new batch",
              type: "pcr-batch",
              // Storage Unit / Storage Unit type are always set for each request.
              storageUnit: {
                id: null,
                type: "storage-unit"
              },
              relationships: {
                experimenters: {
                  data: [
                    { id: AGENT_1_UUID, type: "person" },
                    { id: AGENT_2_UUID, type: "person" }
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
      )
    );
  });

  it("Edits an existing PCR Batch", async () => {
    const wrapper = mountWithAppContext(
      <PcrBatchForm pcrBatch={TEST_PCRBATCH} onSaved={mockOnSaved} />,
      { apiContext }
    );

    await wrapper.waitForRequests();

    // Submit Form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    // Test for expected API Response
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            createdBy: "poffm",
            group: "cnc",
            isCompleted: false,
            id: PCR_BATCH_UUID,
            name: "test pcr batch",
            primerForward: {
              id: FORWARD_PRIMER_UUID,
              type: "pcr-primer"
            },
            primerReverse: {
              id: REVERSE_PRIMER_UUID,
              type: "pcr-primer"
            },
            storageUnit: {
              id: null,
              type: "storage-unit"
            },
            type: "pcr-batch",
            relationships: {
              experimenters: {
                data: [
                  { id: AGENT_1_UUID, type: "person" },
                  { id: AGENT_2_UUID, type: "person" },
                  { id: AGENT_3_UUID, type: "person" }
                ]
              },
              attachment: {
                data: [{ id: ATTACHMENT_UUID, type: "metadata" }]
              }
            }
          },
          type: "pcr-batch"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });

  it("Create a PcrBatch with a storage unit type", async () => {
    const wrapper = mountWithAppContext(
      <PcrBatchForm onSaved={mockOnSaved} />,
      { apiContext }
    );

    await wrapper.waitForRequests();

    // Change textbox value to "test new batch"
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: { value: "test new batch" }
    });

    // Select a storage unit type.
    userEvent.click(
      wrapper.getByRole("combobox", {
        name: /storage unit type type here to search\./i
      })
    );
    await wrapper.waitForRequests();
    userEvent.click(wrapper.getByRole("option", { name: /undefined/i }));

    // Submit Form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    // Test for expected API Response
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            createdBy: "test-user",
            name: "test new batch",
            type: "pcr-batch",
            storageUnit: {
              id: null,
              type: "storage-unit"
            },
            relationships: {
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

  it("Create a PcrBatch with a storage unit", async () => {
    const wrapper = mountWithAppContext(
      <PcrBatchForm onSaved={mockOnSaved} />,
      { apiContext }
    );

    await wrapper.waitForRequests();

    // Change textbox value to "test new batch"
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: { value: "test new batch" }
    });

    // Select a storage unit type.
    userEvent.click(
      wrapper.getByRole("combobox", {
        name: /storage unit type type here to search\./i
      })
    );
    await wrapper.waitForRequests();
    userEvent.click(wrapper.getByRole("option", { name: /undefined/i }));

    await wrapper.waitForRequests();

    // Select a storage unit.
    userEvent.click(wrapper.getByText(/<none>/i));
    await wrapper.waitForRequests();
    userEvent.click(wrapper.getByRole("option", { name: "" }));

    await wrapper.waitForRequests();

    // Submit Form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    // Test expected API Response
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            createdBy: "test-user",
            name: "test new batch",
            type: "pcr-batch",
            // Storage Unit / Storage Unit type are always set for each request.
            storageUnit: {
              id: STORAGE_UNIT_UUID,
              type: "storage-unit"
            },
            relationships: {
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
});
