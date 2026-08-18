import { InputResource, PersistedResource } from "kitsu";
import TransactionEditPage, {
  TransactionForm
} from "../../../../pages/loan-transaction/transaction/edit";
import {
  clearAndType,
  MATERIAL_SAMPLE_MAPPING,
  mountWithAppContext,
  waitForLoadingToDisappear
} from "common-ui";
import { Transaction } from "../../../../types/loan-transaction-api";
import { act, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

// Increased timeout to accommodate slow Formik re-renders in "Submits a Transaction"
// Prevents CI test timeouts and leftover userEvent keystrokes leaking into subsequent tests
jest.setTimeout(120_000);

const routerQuery: Record<string, string | undefined> = {};

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: routerQuery,
    push: jest.fn()
  })
}));

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

function testExistingTransactionWithMaterialSamples(): PersistedResource<Transaction> {
  return {
    type: "transaction",
    id: "test-transaction-broken-material-id",
    transactionNumber: "test number",
    materialSamples: [
      {
        id: "sample-1",
        type: "material-sample"
      },
      {
        id: "sample-2",
        type: "material-sample"
      },
      {
        id: "missing-sample-3",
        type: "material-sample"
      }
    ]
  };
}

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "loan-transaction-api/transaction/test-transaction-id":
      return { data: testExistingTransaction() };
    case "loan-transaction-api/transaction/test-transaction-broken-material-id":
      return { data: testExistingTransactionWithMaterialSamples() };
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
      return MATERIAL_SAMPLE_MAPPING;
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
      case "/material-sample/sample-1?include=organism":
        return {
          id: "sample-1",
          type: "material-sample",
          materialSampleName: "Sample-1"
        };
      case "/material-sample/sample-2?include=organism":
        return {
          id: "sample-2",
          type: "material-sample",
          materialSampleName: "Sample-2"
        };
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

const mockPost = jest.fn<any, any>(async () => {
  return {};
});

const apiContext = {
  save: mockSave,
  bulkGet: mockBulkGet,
  apiClient: {
    get: mockGet,
    axios: {
      get: mockGet,
      post: mockPost
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
    await userEvent.click(wrapper.getByLabelText(/material out/i));
    // Use waitFor to assert that the radio button is checked after the click.
    await waitFor(() =>
      expect(wrapper.getByLabelText(/material out/i)).toBeChecked()
    );

    // To Be Returned switch button
    await userEvent.click(wrapper.getByRole("switch", { name: "" }));
    // Wait for the switch to update its state. A simple check for its role should suffice.
    await waitFor(() =>
      expect(wrapper.getByRole("switch", { name: "" })).toBeInTheDocument()
    );

    // Transaction Type field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /transaction type/i }),
      "transactionType"
    );
    // Transaction Number field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /transaction number/i }),
      "transactionNumber"
    );
    // Other Identifiers field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /other identifiers/i }),
      "otherIdentifiers"
    );
    // Transaction Status field
    await clearAndType(
      wrapper.getAllByRole("textbox", { name: /status/i })[0],
      "status"
    );
    // Purpose field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /purpose/i }),
      "purpose"
    );
    // Opened Date field
    await clearAndType(wrapper.getAllByRole("textbox")[5], "2022-01-01");
    // Closed Date field
    await clearAndType(wrapper.getAllByRole("textbox")[6], "2022-01-02");
    // Due Date field
    await clearAndType(wrapper.getAllByRole("textbox")[7], "2022-01-03");
    // Transaction Remarks field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /transaction remarks/i }),
      "transaction remarks"
    );
    // Shipment Content Remarks field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /content remarks/i }),
      "shipment_contentRemarks"
    );
    // Shipment Value field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /value \(\$ cad\)/i }),
      "10.01"
    );
    // Item Count field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /item count/i }),
      "5"
    );
    // Shipped On field
    await clearAndType(wrapper.getAllByRole("textbox")[12], "2022-02-01");
    // Shipment Status field
    await clearAndType(
      wrapper.getAllByRole("textbox", { name: /status/i })[1],
      "shipment_status"
    );
    // Shipment Packing Method field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /packing method/i }),
      "shipment_packingMethod"
    );
    // Shipment Tracking Number field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /tracking number/i }),
      "shipment_trackingNumber"
    );
    // Shipment Receiver Name field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /receiver name/i }),
      "shipment_address_receiverName"
    );
    // Shipment Company Name field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /company name/i }),
      "shipment_address_companyName"
    );
    // Address Line 1 field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /address line 1/i }),
      "shipment_address_addressLine1"
    );
    // Address Line 2 field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /address line 2/i }),
      "shipment_address_addressLine2"
    );
    // City field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /city/i }),
      "shipment_address_city"
    );
    // Province State field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /province state/i }),
      "shipment_address_provinceState"
    );
    // Zip Code field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /zip code/i }),
      "shipment_address_zipCode"
    );
    // Country field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /country/i }),
      "shipment_address_country"
    );
    // Shipment Remarks field
    await clearAndType(
      wrapper.getByRole("textbox", { name: /shipment remarks/i }),
      "shipment_shipmentRemarks"
    );

    // Add Agent
    await userEvent.click(
      wrapper.getByRole("button", { name: /add new agent/i })
    );
    // Wait for the agent combobox to appear
    await waitFor(() =>
      expect(
        wrapper.getByRole("combobox", { name: /agent/i })
      ).toBeInTheDocument()
    );

    await userEvent.click(wrapper.getByRole("combobox", { name: /agent/i }));
    // Wait for the options to appear after clicking the combobox
    await waitFor(() =>
      expect(
        wrapper.getByRole("option", { name: /test person/i })
      ).toBeInTheDocument()
    );
    await userEvent.click(
      wrapper.getByRole("option", { name: /test person/i })
    );

    // Add an Agent Role:
    await userEvent.click(
      wrapper.getByRole("combobox", { name: /role\/action/i })
    );
    // Wait for the role options to appear
    await waitFor(() =>
      expect(
        wrapper.getByRole("combobox", { name: /role\/action/i })
      ).toBeInTheDocument()
    );
    await userEvent.type(
      wrapper.getByRole("combobox", { name: /role\/action/i }),
      "my-role-1"
    );
    // Wait for the "add" option to appear
    await waitFor(() =>
      expect(
        wrapper.getByRole("option", { name: /add "my-role-1"/i })
      ).toBeInTheDocument()
    );
    await userEvent.click(
      wrapper.getByRole("option", { name: /add "my-role-1"/i })
    );
    // Wait for the role to be added and visible
    await waitFor(() =>
      expect(wrapper.getByText("my-role-1")).toBeInTheDocument()
    );

    // Agent Details Date field
    await clearAndType(
      wrapper.getAllByPlaceholderText(/yyyy\-mm\-dd/i)[3],
      "2022-02-24"
    );
    // Agent Remarks
    await clearAndType(
      wrapper.getByRole("textbox", { name: /agent remarks/i }),
      "test remarks"
    );

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
    routerQuery.id = "test-transaction-id";

    // The Next.js router is mocked to provide the existing Transaction's ID
    const wrapper = mountWithAppContext(
      <TransactionEditPage />,
      testCtx as any
    );
    await waitForLoadingToDisappear();

    // Wait for the existing transaction data to be loaded and displayed in the document.
    // This assumes that the roles or the test person's name would be rendered once the data is loaded.
    await waitFor(() => {
      expect(wrapper.getByText(/role 1/i)).toBeInTheDocument();
      expect(wrapper.getByText(/role 2/i)).toBeInTheDocument();
      expect(wrapper.getByText(/role 3/i)).toBeInTheDocument();
      expect(wrapper.getByText(/test person/i)).toBeInTheDocument();
    });

    const transactionNumberField = wrapper.getByRole("textbox", {
      name: /transaction number/i
    });
    await userEvent.clear(transactionNumberField);
    await userEvent.type(transactionNumberField, "new transaction number");

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Wait for the mockSave to be called after form submission
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    // Test expected response of only expected changes.
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "test-transaction-id",
              type: "transaction",

              // Only change made.
              transactionNumber: "new transaction number"
            },
            type: "transaction"
          }
        ],
        { apiBaseUrl: "/loan-transaction-api" }
      ]
    ]);
  });

  it("Handle edit when an attached material sample doesn't exist anymore", async () => {
    routerQuery.id = "test-transaction-broken-material-id";

    const wrapper = mountWithAppContext(
      <TransactionEditPage />,
      testCtx as any
    );
    await waitForLoadingToDisappear();

    await waitFor(() => {
      // Ensure the proper transaction is loaded before proceeding.
      expect(
        wrapper.getByRole("textbox", { name: /transaction number/i })
      ).toBeInTheDocument();
    });

    // The existing material samples should be displayed, while the missing one should not be included.
    expect(
      wrapper.getByRole("link", { name: /sample\-1/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("link", { name: /sample\-2/i })
    ).toBeInTheDocument();
    expect(wrapper.getByText(/total selected records: 2/i)).toBeInTheDocument();

    // Make a change to the transaction number.
    const transactionNumberField = wrapper.getByRole("textbox", {
      name: /transaction number/i
    });
    await userEvent.clear(transactionNumberField);
    await userEvent.type(transactionNumberField, "new transaction number");

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
              id: "test-transaction-broken-material-id",
              type: "transaction",
              transactionNumber: "new transaction number"
            },
            type: "transaction"
          }
        ],
        { apiBaseUrl: "/loan-transaction-api" }
      ]
    ]);
  });

  it("Handle edit when an attached material sample doesn't exist anymore and adding a new material sample", async () => {
    routerQuery.id = "test-transaction-broken-material-id";

    const wrapper = mountWithAppContext(
      <TransactionEditPage />,
      testCtx as any
    );
    await waitForLoadingToDisappear();

    await waitFor(() => {
      // Ensure the proper transaction is loaded before proceeding.
      expect(
        wrapper.getByRole("textbox", { name: /transaction number/i })
      ).toBeInTheDocument();
    });

    // The existing material samples should be displayed, while the missing one should not be included.
    expect(
      wrapper.getByRole("link", { name: /sample\-1/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("link", { name: /sample\-2/i })
    ).toBeInTheDocument();
    expect(wrapper.getByText(/total selected records: 2/i)).toBeInTheDocument();

    // Remove an existing material sample that is loadable.
    await userEvent.click(wrapper.getByTestId("checkbox-sample-2"));
    await userEvent.click(wrapper.getByTestId("remove-resources"));
    await waitForLoadingToDisappear();

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
              id: "test-transaction-broken-material-id",
              type: "transaction",
              relationships: {
                materialSamples: {
                  data: [
                    {
                      id: "sample-1", // Sample 1 remains since Sample 2 was removed and missing-sample-3 was non-loadable.
                      type: "material-sample"
                    },
                    {
                      id: "missing-sample-3", // Important! This should be here since it was non-loadable.
                      type: "material-sample"
                    }
                  ]
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

  it("Make no changes, expect no save request performed", async () => {
    routerQuery.id = "test-transaction-broken-material-id";

    const wrapper = mountWithAppContext(
      <TransactionEditPage />,
      testCtx as any
    );
    await waitForLoadingToDisappear();

    await waitFor(() => {
      // Ensure the proper transaction is loaded before proceeding.
      expect(
        wrapper.getByRole("textbox", { name: /transaction number/i })
      ).toBeInTheDocument();
    });

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Wait a moment to ensure no save call is made.
    await act(async () => {
      await new Promise(setImmediate);
    });
    expect(mockSave).not.toHaveBeenCalled();
  });
});
