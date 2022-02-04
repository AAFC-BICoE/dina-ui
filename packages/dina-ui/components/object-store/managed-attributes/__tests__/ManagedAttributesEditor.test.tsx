import { DinaForm, ResourceSelect } from "common-ui";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { ManagedAttributesEditor } from "../ManagedAttributesEditor";

const EXAMPLE_MA_1 = {
  id: "1",
  key: "example_attribute_1",
  name: "Example Attribute 1",
  managedAttributeType: "STRING",
  managedAttributeComponent: "COLLECTING_EVENT"
};

const EXAMPLE_MA_2 = {
  id: "2",
  key: "example_attribute_2",
  name: "Example Attribute 2",
  managedAttributeType: "STRING",
  managedAttributeComponent: "COLLECTING_EVENT"
};

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map(path => {
    switch (path) {
      case "/managed-attribute/COLLECTING_EVENT.example_attribute_1":
        return EXAMPLE_MA_1;
      case "/managed-attribute/COLLECTING_EVENT.example_attribute_2":
        return EXAMPLE_MA_2;
    }
  })
);

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/managed-attribute":
      return { data: [] };
  }
});

const apiContext = {
  apiClient: {
    get: mockGet
  },
  bulkGet: mockBulkGet
};

const exampleValues = {
  example_attribute_1: "example-value-1",
  example_attribute_2: "example-value-2"
};

describe("ManagedAttributesEditor component", () => {
  it("Renders the current values.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ managedAttributes: exampleValues }}>
        <ManagedAttributesEditor
          valuesPath="managedAttributes"
          managedAttributeApiPath="collection-api/managed-attribute"
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
        ],
        {
          apiBaseUrl: "/collection-api",
          returnNullForMissingResource: true
        }
      ]
    ]);
    expect(wrapper.find(".example_attribute_1 input").prop("value")).toEqual(
      "example-value-1"
    );
    expect(wrapper.find(".example_attribute_2 input").prop("value")).toEqual(
      "example-value-2"
    );
  });

  it("Lets you remove a managed attribute value by removing it from the dropdown menu.", async () => {
    const mockSubmit = jest.fn();

    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ managedAttributes: exampleValues }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <ManagedAttributesEditor
          valuesPath="managedAttributes"
          managedAttributeApiPath="collection-api/managed-attribute"
          managedAttributeComponent="COLLECTING_EVENT"
          managedAttributeKeyField="key"
        />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Remove attribute 2:
    wrapper
      .find(".editable-attribute-menu")
      .find<any>(ResourceSelect)
      .prop("onChange")([EXAMPLE_MA_1]);

    await new Promise(setImmediate);
    wrapper.update();

    // Confirm "yes":
    wrapper.find(".modal-body form").simulate("submit");

    await new Promise(setImmediate);
    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSubmit).lastCalledWith({
      managedAttributes: {
        example_attribute_1: "example-value-1"
      }
    });
  });
});
