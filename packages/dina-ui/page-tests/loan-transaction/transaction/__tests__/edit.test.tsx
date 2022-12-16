import { ResourceSelect } from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import CreatableSelect from "react-select/creatable";
import Switch from "react-switch";
import TransactionEditPage, {
  TransactionForm
} from "../../../../pages/loan-transaction/transaction/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Transaction } from "../../../../types/loan-transaction-api";

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
    case "agent-api/person":
    case "objectstore-api/metadata":
      return { data: [] };
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
    wrapper
      .find(".materialDirection-field input")
      .at(1) // Change to OUT
      .simulate("change", { target: { checked: "true" } });
    wrapper
      .find(".materialToBeReturned-field")
      .find(Switch)
      .prop<any>("onChange")(true);
    wrapper
      .find(".transactionType-field input")
      .simulate("change", { target: { value: "transactionType" } });
    wrapper
      .find(".transactionNumber-field input")
      .simulate("change", { target: { value: "transactionNumber" } });
    wrapper
      .find(".otherIdentifiers-field textarea")
      .simulate("change", { target: { value: "otherIdentifiers" } });
    wrapper
      .find(".status-field input")
      .at(0)
      .simulate("change", { target: { value: "status" } });
    wrapper
      .find(".purpose-field input")
      .simulate("change", { target: { value: "purpose" } });
    wrapper
      .find(".openedDate-field input")
      .simulate("change", { target: { value: "2022-01-01" } });
    wrapper
      .find(".closedDate-field input")
      .simulate("change", { target: { value: "2022-01-02" } });
    wrapper
      .find(".dueDate-field input")
      .simulate("change", { target: { value: "2022-01-03" } });
    wrapper
      .find(".transactionRemarks-field textarea")
      .simulate("change", { target: { value: "transaction remarks" } });
    wrapper
      .find(".shipment_contentRemarks-field textarea")
      .simulate("change", { target: { value: "shipment_contentRemarks" } });
    wrapper
      .find(".shipment_value-field input")
      .simulate("change", { target: { value: "10.01" } });
    wrapper
      .find(".shipment_itemCount-field input")
      .simulate("change", { target: { value: "5" } });
    wrapper
      .find(".shipment_shippedOn-field input")
      .simulate("change", { target: { value: "2022-02-01" } });
    wrapper
      .find(".shipment_status-field input")
      .simulate("change", { target: { value: "shipment_status" } });
    wrapper
      .find(".shipment_packingMethod-field input")
      .simulate("change", { target: { value: "shipment_packingMethod" } });
    wrapper
      .find(".shipment_trackingNumber-field input")
      .simulate("change", { target: { value: "shipment_trackingNumber" } });
    wrapper
      .find(".shipment_address_receiverName-field input")
      .simulate("change", {
        target: { value: "shipment_address_receiverName" }
      });
    wrapper
      .find(".shipment_address_companyName-field input")
      .simulate("change", {
        target: { value: "shipment_address_companyName" }
      });
    wrapper
      .find(".shipment_address_addressLine1-field input")
      .simulate("change", {
        target: { value: "shipment_address_addressLine1" }
      });
    wrapper
      .find(".shipment_address_addressLine2-field input")
      .simulate("change", {
        target: { value: "shipment_address_addressLine2" }
      });
    wrapper
      .find(".shipment_address_city-field input")
      .simulate("change", { target: { value: "shipment_address_city" } });
    wrapper
      .find(".shipment_address_provinceState-field input")
      .simulate("change", {
        target: { value: "shipment_address_provinceState" }
      });
    wrapper
      .find(".shipment_address_zipCode-field input")
      .simulate("change", { target: { value: "shipment_address_zipCode" } });
    wrapper
      .find(".shipment_address_country-field input")
      .simulate("change", { target: { value: "shipment_address_country" } });
    wrapper
      .find(".shipment_shipmentRemarks-field textarea")
      .simulate("change", { target: { value: "shipment_shipmentRemarks" } });

    // Add an Agent role:
    wrapper.find(".agent-roles-section button.add-button").simulate("click");
    wrapper
      .find(".agentRoles_0__roles-field")
      .find(CreatableSelect)
      .prop<any>("onChange")([{ value: "my-role-1" }]);
    wrapper
      .find(".agentRoles_0__agent-field")
      .find(ResourceSelect)
      .prop<any>("onChange")({
      id: "test-person-id",
      type: "person",
      displayName: "Test Person"
    });
    wrapper
      .find(".agentRoles_0__date-field input")
      .simulate("change", { target: { value: "2022-02-24" } });
    wrapper
      .find(".agentRoles_0__remarks-field textarea")
      .simulate("change", { target: { value: "test remarks" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

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

    await new Promise(setImmediate);
    wrapper.update();

    // The Agent ID string should be converted to an object with ID and type:
    expect(
      wrapper
        .find(".agentRoles_0__agent-field")
        .find(ResourceSelect)
        .prop("value")
    ).toEqual({
      id: "test-person-id",
      type: "person"
    });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

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
