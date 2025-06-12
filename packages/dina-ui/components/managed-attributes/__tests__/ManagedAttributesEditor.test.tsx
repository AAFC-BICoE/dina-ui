import { DinaForm } from "common-ui";
import { PersistedResource } from "kitsu";
import { FormTemplate } from "../../../types/collection-api";
import { mountWithAppContext } from "common-ui";
import { ManagedAttributesEditor } from "../ManagedAttributesEditor";
import { waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const EXAMPLE_MA_1 = {
  id: "1",
  key: "example_attribute_1",
  name: "Example Attribute 1",
  vocabularyElementType: "STRING",
  managedAttributeComponent: "COLLECTING_EVENT"
};

const EXAMPLE_MA_2 = {
  id: "2",
  key: "example_attribute_2",
  name: "Example Attribute 2",
  vocabularyElementType: "STRING",
  managedAttributeComponent: "COLLECTING_EVENT"
};

const EXAMPLE_MA_3 = {
  id: "3",
  key: "example_attribute_3",
  name: "Example Attribute 3",
  vocabularyElementType: "STRING",
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
  paths.map((path) => {
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
      return { data: [EXAMPLE_MA_1, EXAMPLE_MA_2] };
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

const mockSave = jest.fn((ops) =>
  ops.map((op) => ({
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
    const { container } = mountWithAppContext(
      <DinaForm initialValues={{ managedAttributes: exampleValues }}>
        <ManagedAttributesEditor
          valuesPath="managedAttributes"
          managedAttributeApiPath="collection-api/managed-attribute"
          managedAttributeComponent="COLLECTING_EVENT"
        />
      </DinaForm>,
      { apiContext }
    );

    // Wait for the data to load and ensure mockBulkGet was called with expected arguments.
    await waitFor(() => {
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
    });

    // Verify that the correct input values are rendered.
    const exampleAttribute1Input = container.querySelector(
      ".example_attribute_1-field input"
    ) as HTMLInputElement;
    const exampleAttribute2Input = container.querySelector(
      ".example_attribute_2-field input"
    ) as HTMLInputElement;

    expect(exampleAttribute1Input.value).toEqual("example-value-1");
    expect(exampleAttribute2Input.value).toEqual("example-value-2");
  });
  it("Lets you remove an attribute value with the remove button", async () => {
    const mockSubmit = jest.fn();

    const { container, findByText, queryByText } = mountWithAppContext(
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

    // Click the Remove button:
    const removeButton = await findByText("Example Attribute 2").then((label) =>
      label
        .closest(".example_attribute_2-field")
        ?.querySelector("button.remove-attribute")
    );

    if (removeButton) {
      fireEvent.click(removeButton);
    }

    // Verify the field is removed
    await waitFor(() => {
      expect(queryByText("Example Attribute 2")).not.toBeInTheDocument();
    });

    // Submit the form
    const form = container.querySelector("form");
    fireEvent.submit(form!);

    // Verify the mockSubmit was called without example_attribute_2
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        managedAttributes: { ...exampleValues, example_attribute_2: undefined }
      });
    });
  });
});
