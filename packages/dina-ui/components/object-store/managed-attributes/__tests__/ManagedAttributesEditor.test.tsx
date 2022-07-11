import { DinaForm, ResourceSelect } from "common-ui";
import { PersistedResource } from "kitsu";
import { FormTemplate } from "../../../../types/collection-api";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { ManagedAttributesEditor } from "../ManagedAttributesEditor";
import Select from "react-select/base";

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

const EXAMPLE_MA_3 = {
  id: "3",
  key: "example_attribute_3",
  name: "Example Attribute 3",
  managedAttributeType: "STRING",
  managedAttributeComponent: "COLLECTING_EVENT"
};

const TEST_COLLECTING_EVENT_CUSTOM_VIEW: PersistedResource<FormTemplate> = {
  id: "existing-view-id",
  type: "form-template",
  name: "Test existing Form Template",
  viewConfiguration: {
    type: "managed-attributes-view",
    managedAttributeComponent: "COLLECTING_EVENT",
    attributeKeys: ["example_attribute_1", "example_attribute_3"]
  }
};

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map(path => {
    switch (path) {
      case "managed-attribute/COLLECTING_EVENT.example_attribute_1":
        return EXAMPLE_MA_1;
      case "managed-attribute/COLLECTING_EVENT.example_attribute_2":
        return EXAMPLE_MA_2;
      case "managed-attribute/COLLECTING_EVENT.example_attribute_3":
        return EXAMPLE_MA_3;
    }
  })
);

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "collection-api/managed-attribute":
      return { data: [] };
    case "collection-api/form-template/existing-view-id":
      return {
        data: TEST_COLLECTING_EVENT_CUSTOM_VIEW
      };
    case "collection-api/form-template":
      if (
        params?.filter?.["viewConfiguration.type"] ===
          "managed-attributes-view" &&
        params?.filter?.["viewConfiguration.managedAttributeComponent"] ===
          "COLLECTING_EVENT"
      ) {
        return {
          data: [TEST_COLLECTING_EVENT_CUSTOM_VIEW]
        };
      }
    case "collection-api/managed-attribute/COLLECTING_EVENT.example_attribute_1":
      return { data: EXAMPLE_MA_1 };
    case "collection-api/managed-attribute/COLLECTING_EVENT.example_attribute_2":
      return { data: EXAMPLE_MA_2 };
    case "collection-api/managed-attribute/COLLECTING_EVENT.example_attribute_3":
      return { data: EXAMPLE_MA_3 };
    case "collection-api/form-template":
    case "user-api/group":
      return { data: [] };
  }
});

const mockSave = jest.fn(ops =>
  ops.map(op => ({
    ...op.resource,
    id: op.resource.id ?? "11111"
  }))
);

const apiContext = {
  apiClient: {
    get: mockGet
  },
  bulkGet: mockBulkGet,
  save: mockSave
};

const exampleValues = {
  example_attribute_1: "example-value-1",
  example_attribute_2: "example-value-2"
};

describe("ManagedAttributesEditor component", () => {
  beforeEach(jest.clearAllMocks);

  it("Renders the current values.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ managedAttributes: exampleValues }}>
        <ManagedAttributesEditor
          valuesPath="managedAttributes"
          managedAttributeApiPath="collection-api/managed-attribute"
          managedAttributeComponent="COLLECTING_EVENT"
        />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockBulkGet.mock.calls).toEqual([
      [
        [
          "managed-attribute/COLLECTING_EVENT.example_attribute_1",
          "managed-attribute/COLLECTING_EVENT.example_attribute_2"
        ],
        {
          apiBaseUrl: "/collection-api",
          returnNullForMissingResource: true
        }
      ]
    ]);
    expect(
      wrapper.find(".example_attribute_1-field input").prop("value")
    ).toEqual("example-value-1");
    expect(
      wrapper.find(".example_attribute_2-field input").prop("value")
    ).toEqual("example-value-2");
  });

  it("Lets you visually hide a managed attribute value by removing it from the dropdown menu.", async () => {
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
        />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Attribute 2 exists
    expect(wrapper.find(".example_attribute_2-field input").exists()).toEqual(
      true
    );

    // Remove attribute 2:
    wrapper
      .find(".visible-attribute-menu")
      .find<any>(ResourceSelect)
      .prop("onChange")([EXAMPLE_MA_1]);

    await new Promise(setImmediate);
    wrapper.update();

    // attribute 2 is hidden, not removed:
    expect(wrapper.find(".example_attribute_2-field input").exists()).toEqual(
      false
    );

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // The data should be unchanged, because the attribute was hidden, not deleted:
    expect(mockSubmit).lastCalledWith({
      managedAttributes: exampleValues
    });
  });

  it("Lets you remove an attribute value with the remove button", async () => {
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
        />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Click the Remove button:
    wrapper
      .find(".example_attribute_2-field button.remove-attribute")
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // The field is removed:
    expect(wrapper.find(".example_attribute_2-field").exists()).toEqual(false);

    // Submit the form
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Attribute 2 was removed from the attribute map:
    expect(mockSubmit).lastCalledWith({
      managedAttributes: { ...exampleValues, example_attribute_2: undefined }
    });
  });

  it("Lets you select a Form Template .", async () => {
    const mockSubmit = jest.fn();

    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          managedAttributes: {
            example_attribute_1: "initial value 1",
            example_attribute_2: "initial value 2"
          }
        }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <ManagedAttributesEditor
          valuesPath="managedAttributes"
          managedAttributeApiPath="collection-api/managed-attribute"
          managedAttributeComponent="COLLECTING_EVENT"
          showFormTemplateDropdown={true}
        />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Select the custom view:
    wrapper
      .find(".managed-attributes-view-select")
      .find(ResourceSelect)
      .prop<any>("onChange")(TEST_COLLECTING_EVENT_CUSTOM_VIEW);

    await new Promise(setImmediate);
    wrapper.update();

    // Only #1 and #3 should be visible. Even though the value for #2 exists, it's hidden in this view:
    expect(wrapper.find(".example_attribute_1-field input").exists()).toEqual(
      true
    );
    expect(wrapper.find(".example_attribute_2-field input").exists()).toEqual(
      false
    );
    expect(wrapper.find(".example_attribute_3-field input").exists()).toEqual(
      true
    );

    // Set a value on #3
    wrapper
      .find(".example_attribute_3-field input")
      .simulate("change", { target: { value: "new attribute #3 value" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Attributes 1 and 2 are unchanged (even though @2 was hidden by the view), and attribute #3 value was added:
    expect(mockSubmit).lastCalledWith({
      managedAttributes: {
        example_attribute_1: "initial value 1",
        example_attribute_2: "initial value 2",
        example_attribute_3: "new attribute #3 value"
      }
    });
  });

  it("Lets you create a new custom view from a dropdown menu 'Create' option.", async () => {
    const mockSubmit = jest.fn();

    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ managedAttributes: {} }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <ManagedAttributesEditor
          valuesPath="managedAttributes"
          managedAttributeApiPath="collection-api/managed-attribute"
          managedAttributeComponent="COLLECTING_EVENT"
          showFormTemplateDropdown={true}
        />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // The dropdown has the "Create" option:
    const asyncOptions = wrapper
      .find(".managed-attributes-view-select")
      .find(Select)
      .prop<any>("options")[1].options;
    const createOption = asyncOptions[0];
    expect(createOption.label).toEqual("Create Form Template");

    // Select the Create option, which should call the callback:
    wrapper
      .find(".managed-attributes-view-select")
      .find(Select)
      .prop<any>("onChange")(createOption);

    await new Promise(setImmediate);
    wrapper.update();

    // Set the name:
    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "test view" } });

    await new Promise(setImmediate);
    wrapper.update();

    // Add a managed attribute for the new view:
    wrapper
      .find(".managed-attributes-select")
      .find(ResourceSelect)
      .prop<any>("onChange")({
      key: "example_attribute_1"
    });

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(".managed-attributes-view-form form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    const EXPECTED_CREATED_CUSTOM_VIEW = {
      name: "test view",
      restrictToCreatedBy: true,
      type: "form-template",
      viewConfiguration: {
        attributeKeys: ["example_attribute_1"],
        managedAttributeComponent: "COLLECTING_EVENT",
        type: "managed-attributes-view"
      }
    };

    // The new view is created:
    expect(mockSave).lastCalledWith(
      [
        {
          resource: EXPECTED_CREATED_CUSTOM_VIEW,
          type: "form-template"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    // The new form-template is set into the managed attributes editor:
    expect(
      wrapper.find(".managed-attributes-view-select").find(Select).prop("value")
    ).toEqual({
      label: "test view",
      resource: { ...EXPECTED_CREATED_CUSTOM_VIEW, id: "11111" },
      value: "11111"
    });
  });

  it("Lets you edit an existing custom view from an 'Edit' button.", async () => {
    const mockSubmit = jest.fn();

    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ managedAttributes: {} }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <ManagedAttributesEditor
          valuesPath="managedAttributes"
          managedAttributeApiPath="collection-api/managed-attribute"
          managedAttributeComponent="COLLECTING_EVENT"
          showFormTemplateDropdown={true}
        />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Select the custom view:
    wrapper
      .find(".managed-attributes-view-select")
      .find(ResourceSelect)
      .prop<any>("onChange")(TEST_COLLECTING_EVENT_CUSTOM_VIEW);

    await new Promise(setImmediate);
    wrapper.update();

    // Press the edit button
    wrapper.find("button.form-template-edit-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // The managedAttributeComponent field is disabled in the modal form:
    expect(
      wrapper
        .find(".viewConfiguration_managedAttributeComponent-field")
        .find(Select)
        .prop("isDisabled")
    ).toEqual(true);

    // Remove the second attribute (attribute #3):
    wrapper
      .find(".managed-attributes-view-form button.remove-attribute")
      .at(1)
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Submit the form:
    wrapper.find(".managed-attributes-view-form form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    const EXPECTED_SAVED_CUSTOM_VIEW = {
      ...TEST_COLLECTING_EVENT_CUSTOM_VIEW,
      viewConfiguration: {
        ...(TEST_COLLECTING_EVENT_CUSTOM_VIEW.viewConfiguration as any),
        // Attribute #3 was removed:
        attributeKeys: ["example_attribute_1"]
      }
    };

    // The new view is created:
    expect(mockSave).lastCalledWith(
      [
        {
          resource: EXPECTED_SAVED_CUSTOM_VIEW,
          type: "form-template"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    // The saved form-template is set into the managed attributes editor:
    expect(
      wrapper.find(".managed-attributes-view-select").find(Select).prop("value")
    ).toEqual({
      label: "Test existing Form Template",
      resource: EXPECTED_SAVED_CUSTOM_VIEW,
      value: "existing-view-id"
    });
  });
});
