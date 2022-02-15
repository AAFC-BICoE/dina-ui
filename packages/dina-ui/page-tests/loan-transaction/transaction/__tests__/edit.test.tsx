import { InputResource } from "kitsu";
import { Transaction } from "../../../../types/loan-transaction-api";
import { TransactionForm } from "../../../../pages/loan-transaction/transaction/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import Switch from "react-switch";

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "user-api/group":
    case "loan-transaction-api/transaction":
      return { data: [] };
  }
});

const mockSave = jest.fn(async saves => {
  return saves.map(save => ({
    ...save.resource,
    id: save.resource.id ?? "123"
  }));
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map(path => {
    switch (path) {
    }
  })
);

const apiContext = {
  save: mockSave,
  bulkGet: mockBulkGet,
  apiClient: {
    get: mockGet
  }
};

const testCtx = { apiContext };

const mockOnSaved = jest.fn();

describe("Transaction Form", () => {
  beforeEach(jest.clearAllMocks);

  it("Submits a Transaction", async () => {
    const wrapper = mountWithAppContext(
      <TransactionForm onSaved={mockOnSaved} />,
      testCtx
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
      .find(".remarks-field textarea")
      .simulate("change", { target: { value: "remarks" } });
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

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    /** Make sure the expected submission matches the typescript type. */
    const EXPECTED_SUBMITTED_TRANSACTION: InputResource<Transaction> = {
      closedDate: "2022-01-02",
      dueDate: "2022-01-03",
      materialDirection: "OUT",
      materialToBeReturned: true,
      openedDate: "2022-01-01",
      otherIdentifiers: ["otherIdentifiers"],
      purpose: "purpose",
      remarks: "remarks",
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
});
