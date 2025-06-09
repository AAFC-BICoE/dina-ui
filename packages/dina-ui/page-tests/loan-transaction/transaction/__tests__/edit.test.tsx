import { InputResource, PersistedResource } from "kitsu";
import TransactionEditPage, {
  TransactionForm
} from "../../../../pages/loan-transaction/transaction/edit";
import { mountWithAppContext } from "common-ui";
import { Transaction } from "../../../../types/loan-transaction-api";
import { fireEvent, waitFor } from "@testing-library/react"; // Import waitFor
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

function testExistingTransaction(): PersistedResource<Transaction> {
  return {
    type: "transaction",
    id: "test-transaction-id",
    transactionNumber: "test number",
    agentRoles: [
      {
        agent: "test-person-id",
        date: "2022-02-24",
        roles: ["role 1", "role 2", "role 3"]
      }
    ],
    attachment: [
      { id: "attach-1", type: "metadata" },
      { id: "attach-2", type: "metadata" }
    ]
  };
}

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { id: "test-transaction-id" },
    push: () => undefined
  })
}));

const MOCK_INDEX_MAPPING_RESP = {
  data: {
    indexName: "dina_material_sample_index",
    attributes: [
      {
        name: "materialSampleName",
        type: "text",
        path: "data.attributes"
      },
      {
        name: "dwcOtherCatalogNumbers",
        type: "text",
        path: "data.attributes"
      }
    ],
    relationships: []
  }
};

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "loan-transaction-api/transaction/test-transaction-id":
      return { data: testExistingTransaction() };
    case "user-api/group":
    case "loan-transaction-api/transaction":
    case "loan-transaction-api/managed-attribute":
    case "loan-transaction/transaction":
    case "objectstore-api/metadata":
      return { data: [] };
    case "agent-api/person":
      return {
        data: [
          {
            id: "test-person-id",
            type: "person",
            displayName: "Test Person"
          }
        ]
      };
    case "search-api/search-ws/mapping":
      return MOCK_INDEX_MAPPING_RESP;
  }
});

const mockSave = jest.fn(async (saves) => {
  return saves.map((save) => ({
    ...save.resource,
    id: save.resource.id ?? "123"
  }));
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map((path) => {
    switch (path) {
      case "metadata/attach-1":
        return { id: "metadata/attach-1", type: "metadata" };
      case "metadata/attach-2":
        return { id: "metadata/attach-2", type: "metadata" };
      case "person/test-person-id":
        return {
          id: "test-person-id",
          type: "person",
          displayName: "Test Person"
        };
    }
  })
);

const apiContext = {
  save: mockSave,
  bulkGet: mockBulkGet,
  apiClient: {
    get: mockGet,
    axios: {
      get: mockGet
    }
  }
};

const testCtx = { apiContext };

const mockOnSaved = jest.fn();

describe("Transaction Form", () => {
  beforeEach(jest.clearAllMocks);

  it("Submits a Transaction", async () => {
    const wrapper = mountWithAppContext(
      <TransactionForm onSaved={mockOnSaved} />,
      testCtx as any
    );

    // Fill out all fields:
    // Material Out radio button
    fireEvent.click(wrapper.getByLabelText(/material out/i));
    // Use waitFor to assert that the radio button is checked after the click.
    await waitFor(() =>
      expect(wrapper.getByLabelText(/material out/i)).toBeChecked()
    );

    // To Be Returned switch button
    fireEvent.click(wrapper.getByRole("switch", { name: "" }));
    // Wait for the switch to update its state. A simple check for its role should suffice.
    await waitFor(() =>
      expect(wrapper.getByRole("switch", { name: "" })).toBeInTheDocument()
    );

    // Transaction Type field
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /transaction type/i }),
      {
        target: { value: "transactionType" }
      }
    );
    // Transaction Number field
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /transaction number/i }),
      {
        target: { value: "transactionNumber" }
      }
    );
    // Other Identifiers field
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /other identifiers/i }),
      {
        target: { value: "otherIdentifiers" }
      }
    );
    // Transaction Status field
    fireEvent.change(wrapper.getAllByRole("textbox", { name: /status/i })[0], {
      target: { value: "status" }
    });
    // Purpose field
    fireEvent.change(wrapper.getByRole("textbox", { name: /purpose/i }), {
      target: { value: "purpose" }
    });
    // Opened Date field
    fireEvent.change(wrapper.getAllByRole("textbox")[5], {
      target: { value: "2022-01-01" }
    });
    // Closed Date field
    fireEvent.change(wrapper.getAllByRole("textbox")[6], {
      target: { value: "2022-01-02" }
    });
    // Due Date field
    fireEvent.change(wrapper.getAllByRole("textbox")[7], {
      target: { value: "2022-01-03" }
    });
    // Transaction Remarks field
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /transaction remarks/i }),
      {
        target: { value: "transaction remarks" }
      }
    );
    // Shipment Content Remarks field
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /content remarks/i }),
      {
        target: { value: "shipment_contentRemarks" }
      }
    );
    // Shipment Value field
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /value \(\$ cad\)/i }),
      {
        target: { value: "10.01" }
      }
    );
    // Item Count field
    fireEvent.change(wrapper.getByRole("textbox", { name: /item count/i }), {
      target: { value: "5" }
    });
    // Shipped On field
    fireEvent.change(wrapper.getAllByRole("textbox")[12], {
      target: { value: "2022-02-01" }
    });
    // Shipment Status field
    fireEvent.change(wrapper.getAllByRole("textbox", { name: /status/i })[1], {
      target: { value: "shipment_status" }
    });
    // Shipment Packing Method field
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /packing method/i }),
      {
        target: { value: "shipment_packingMethod" }
      }
    );
    // Shipment Tracking Number field
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /tracking number/i }),
      {
        target: { value: "shipment_trackingNumber" }
      }
    );
    // Shipment Receiver Name field
    fireEvent.change(wrapper.getByRole("textbox", { name: /receiver name/i }), {
      target: { value: "shipment_address_receiverName" }
    });
    // Shipment Company Name field
    fireEvent.change(wrapper.getByRole("textbox", { name: /company name/i }), {
      target: { value: "shipment_address_companyName" }
    });
    // Address Line 1 field
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /address line 1/i }),
      {
        target: { value: "shipment_address_addressLine1" }
      }
    );
    // Address Line 2 field
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /address line 2/i }),
      {
        target: { value: "shipment_address_addressLine2" }
      }
    );
    // City field
    fireEvent.change(wrapper.getByRole("textbox", { name: /city/i }), {
      target: { value: "shipment_address_city" }
    });
    // Province State field
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /province state/i }),
      {
        target: { value: "shipment_address_provinceState" }
      }
    );
    // Zip Code field
    fireEvent.change(wrapper.getByRole("textbox", { name: /zip code/i }), {
      target: { value: "shipment_address_zipCode" }
    });
    // Country field
    fireEvent.change(wrapper.getByRole("textbox", { name: /country/i }), {
      target: { value: "shipment_address_country" }
    });
    // Shipment Remarks field
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /shipment remarks/i }),
      {
        target: { value: "shipment_shipmentRemarks" }
      }
    );

    // Add Agent
    fireEvent.click(wrapper.getByRole("button", { name: /add new agent/i }));
    // Wait for the agent combobox to appear
    await waitFor(() =>
      expect(
        wrapper.getByRole("combobox", { name: /agent/i })
      ).toBeInTheDocument()
    );

    userEvent.click(wrapper.getByRole("combobox", { name: /agent/i }));
    // Wait for the options to appear after clicking the combobox
    await waitFor(() =>
      expect(
        wrapper.getByRole("option", { name: /test person/i })
      ).toBeInTheDocument()
    );
    userEvent.click(wrapper.getByRole("option", { name: /test person/i }));

    // Add an Agent Role:
    userEvent.click(wrapper.getByRole("combobox", { name: /role\/action/i }));
    // Wait for the role options to appear
    await waitFor(() =>
      expect(
        wrapper.getByRole("combobox", { name: /role\/action/i })
      ).toBeInTheDocument()
    );
    fireEvent.change(wrapper.getByRole("combobox", { name: /role\/action/i }), {
      target: { value: "my-role-1" }
    });
    // Wait for the "add" option to appear
    await waitFor(() =>
      expect(
        wrapper.getByRole("option", { name: /add "my-role-1"/i })
      ).toBeInTheDocument()
    );
    userEvent.click(wrapper.getByRole("option", { name: /add "my-role-1"/i }));
    // Wait for the role to be added and visible
    await waitFor(() =>
      expect(wrapper.getByText(/my-role-1/i)).toBeInTheDocument()
    );

    // Agent Details Date field
    fireEvent.change(wrapper.getAllByPlaceholderText(/yyyy\-mm\-dd/i)[3], {
      target: { value: "2022-02-24" }
    });
    // Agent Remarks
    fireEvent.change(wrapper.getByRole("textbox", { name: /agent remarks/i }), {
      target: { value: "test remarks" }
    });

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Wait for the mockSave to be called after form submission
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    /** Make sure the expected submission matches the typescript type. */
    const EXPECTED_SUBMITTED_TRANSACTION: InputResource<Transaction> & {
      relationships: any;
    } = {
      agentRoles: [
        {
          // The agent should be submitted as just an ID, not the full person object:
          agent: "test-person-id",
          date: "2022-02-24",
          remarks: "test remarks",
          roles: ["my-role-1"]
        }
      ],
      attachment: undefined,
      materialSamples: undefined,
      closedDate: "2022-01-02",
      dueDate: "2022-01-03",
      materialDirection: "OUT",
      materialToBeReturned: true,
      openedDate: "2022-01-01",
      otherIdentifiers: ["otherIdentifiers"],
      purpose: "purpose",
      relationships: {
        materialSamples: {
          data: []
        }
      },
      remarks: "transaction remarks",
      shipment: {
        address: {
          addressLine1: "shipment_address_addressLine1",
          addressLine2: "shipment_address_addressLine2",
          city: "shipment_address_city",
          companyName: "shipment_address_companyName",
          country: "shipment_address_country",
          provinceState: "shipment_address_provinceState",
          receiverName: "shipment_address_receiverName",
          zipCode: "shipment_address_zipCode"
        },
        contentRemarks: "shipment_contentRemarks",
        itemCount: "5",
        packingMethod: "shipment_packingMethod",
        shipmentRemarks: "shipment_shipmentRemarks",
        shippedOn: "2022-02-01",
        status: "shipment_status",
        trackingNumber: "shipment_trackingNumber",
        value: "10.01"
      },
      status: "status",
      transactionNumber: "transactionNumber",
      transactionType: "transactionType",
      type: "transaction"
    };

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: EXPECTED_SUBMITTED_TRANSACTION,
            type: "transaction"
          }
        ],
        { apiBaseUrl: "/loan-transaction-api" }
      ]
    ]);
    expect(mockOnSaved.mock.calls).toEqual([
      [
        {
          ...EXPECTED_SUBMITTED_TRANSACTION,
          id: "123"
        }
      ]
    ]);
  });

  it("Edits an existing Transaction", async () => {
    // The Next.js router is mocked to provide the existing Transaction's ID
    const wrapper = mountWithAppContext(
      <TransactionEditPage />,
      testCtx as any
    );

    // Wait for the existing transaction data to be loaded and displayed in the document.
    // This assumes that the roles or the test person's name would be rendered once the data is loaded.
    await waitFor(() => {
      expect(wrapper.getByText(/role 1/i)).toBeInTheDocument();
      expect(wrapper.getByText(/role 2/i)).toBeInTheDocument();
      expect(wrapper.getByText(/role 3/i)).toBeInTheDocument();
      expect(wrapper.getByText(/test person/i)).toBeInTheDocument();
    });

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Wait for the mockSave to be called after form submission
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Test expected response
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              ...testExistingTransaction(),
              attachment: undefined,
              materialSamples: undefined,
              // Moves the attachments into the relationships field:
              relationships: {
                attachment: {
                  data: [
                    { id: "attach-1", type: "metadata" },
                    { id: "attach-2", type: "metadata" }
                  ]
                },
                materialSamples: {
                  data: []
                }
              }
            },
            type: "transaction"
          }
        ],
        { apiBaseUrl: "/loan-transaction-api" }
      ]
    ]);
  });
});
