import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { ManagedAttributeValues } from "../../../../types/objectstore-api";
import { ManagedAttributesEditor } from "../ManagedAttributesEditor";

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map(path => {
    if (path === "/managed-attribute/COLLECTING_EVENT.example_attribute_1") {
      return {
        id: "1",
        key: "example_attribute_1",
        name: "Example Attribute 1",
        managedAttributeType: "STRING",
        managedAttributeComponent: "COLLECTING_EVENT"
      };
    } else if (
      path === "/managed-attribute/COLLECTING_EVENT.example_attribute_2"
    ) {
      return {
        id: "2",
        key: "example_attribute_2",
        name: "Example Attribute 2",
        managedAttributeType: "STRING",
        managedAttributeComponent: "COLLECTING_EVENT"
      };
    }
  })
);

const apiContext = {
  bulkGet: mockBulkGet
};

const exampleValues: ManagedAttributeValues = {
  example_attribute_1: { assignedValue: "example-value-1" },
  example_attribute_2: { assignedValue: "example-value-2" }
};

describe("ManagedAttributesEditor component", () => {
  it("Renders the current values.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ managedAttributeValues: exampleValues }}>
        <ManagedAttributesEditor
          valuesPath="managedAttributeValues"
          valueFieldName="assignedValue"
          managedAttributeApiPath="collection-api/managed-attribute"
          apiBaseUrl="/collection-api"
          managedAttributeComponent="COLLECTING_EVENT"
          managedAttributeKeyField="key"
        />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockBulkGet.mock.calls).toEqual([
      [
        [
          "/managed-attribute/COLLECTING_EVENT.example_attribute_1",
          "/managed-attribute/COLLECTING_EVENT.example_attribute_2"
        ]
      ]
    ]);
    expect(wrapper.find(".example_attribute_1 input").prop("value")).toEqual(
      "example-value-1"
    );
    expect(wrapper.find(".example_attribute_2 input").prop("value")).toEqual(
      "example-value-2"
    );
  });
});
