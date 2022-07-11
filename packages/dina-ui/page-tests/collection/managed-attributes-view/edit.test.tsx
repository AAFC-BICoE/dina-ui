import { ResourceSelect } from "common-ui";
import Select from "react-select";
import { ManagedAttributesViewForm } from "../../../components";
import { SortableAttributesViewList } from "../../../components/object-store/managed-attributes/managed-attributes-custom-views/ManagedAttributesSorter";
import ManagedAttributesViewEditPage from "../../../pages/collection/managed-attributes-view/edit";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import {
  FormTemplate,
  managedAttributesViewSchema
} from "../../../types/collection-api";

const mockPush = jest.fn();

const mockQueryStringParams = { id: "123" };
jest.mock("next/router", () => ({
  useRouter: () => ({ query: mockQueryStringParams, push: mockPush })
}));

// Test an existing FormTemplate:
const TEST_CUSTOM_VIEW: FormTemplate = {
  type: "form-template",
  createdBy: "poffm",
  createdOn: "2022-02-03",
  group: "test-group",
  id: "123",
  name: "Test Managed Attributes View",
  restrictToCreatedBy: true,
  viewConfiguration: managedAttributesViewSchema.validateSync({
    managedAttributeComponent: "MATERIAL_SAMPLE",
    attributeKeys: ["attribute_1", "attribute_2"],
    type: "managed-attributes-view"
  })
};
// Test an existing FormTemplate:
const TEST_BAD_CUSTOM_VIEW: FormTemplate = {
  type: "form-template",
  name: "My Custom View",
  viewConfiguration: {
    type: "wrong-type"
  }
};

const ATTRIBUTE_1 = { id: "1", key: "attribute_1", name: "Attribute 1" };
const ATTRIBUTE_2 = { id: "2", key: "attribute_2", name: "Attribute 2" };
const ATTRIBUTE_3 = { id: "3", key: "attribute_3", name: "Attribute 3" };

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/form-template/bad-form-template":
      return { data: TEST_BAD_CUSTOM_VIEW };
    case "collection-api/form-template/123":
      return { data: TEST_CUSTOM_VIEW };
    case "user-api/group":
    case "collection-api/managed-attribute":
      return { data: [] };
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) => {
  return paths.map(path => {
    switch (path) {
      case "managed-attribute/MATERIAL_SAMPLE.attribute_1":
        return ATTRIBUTE_1;
      case "managed-attribute/MATERIAL_SAMPLE.attribute_2":
        return ATTRIBUTE_2;
      case "managed-attribute/MATERIAL_SAMPLE.attribute_3":
        return ATTRIBUTE_3;
    }
  });
});

const mockSave = jest.fn<any, any>(ops =>
  ops.map(op => ({
    ...op.resource,
    id: op.resource.id ?? "11111111-1111-1111-1111-111111111111"
  }))
);

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet
    },
    bulkGet: mockBulkGet,
    save: mockSave
  }
};

describe("ManagedAttributesViewEditPage", () => {
  beforeEach(() => {
    mockQueryStringParams.id = "123";
    jest.clearAllMocks();
  });

  it("Lets you submit a form-template for managed attributes", async () => {
    const mockOnSaved = jest.fn();

    const wrapper = mountWithAppContext(
      <ManagedAttributesViewForm onSaved={mockOnSaved} />,
      testCtx
    );

    // Set the name:
    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "test view" } });

    wrapper
      .find(".managedAttributeComponent-field")
      .find(Select)
      .prop<any>("onChange")({ value: "MATERIAL_SAMPLE" });

    await new Promise(setImmediate);
    wrapper.update();

    // Set the 3 managed attributes:
    wrapper
      .find(".managed-attributes-select")
      .find(ResourceSelect)
      .prop<any>("onChange")({
      key: "attribute_1"
    });
    wrapper
      .find(".managed-attributes-select")
      .find(ResourceSelect)
      .prop<any>("onChange")({
      key: "attribute_2"
    });
    wrapper
      .find(".managed-attributes-select")
      .find(ResourceSelect)
      .prop<any>("onChange")({
      key: "attribute_3"
    });

    await new Promise(setImmediate);
    wrapper.update();

    // The inputs should be disabled when you are just editing a custom view without default values:
    expect(
      wrapper.find(".sortable-managed-attribute input").first().prop("disabled")
    ).toEqual(true);

    // Simulate a Drag and Drop of attribute_3 to the beginning of the list:
    wrapper.find(SortableAttributesViewList).prop<any>("onSortEnd")({
      oldIndex: 2,
      newIndex: 0
    });

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // New Custom View saved:
    expect(mockOnSaved).lastCalledWith({
      id: "11111111-1111-1111-1111-111111111111",
      name: "test view",
      restrictToCreatedBy: true,
      type: "form-template",
      viewConfiguration: {
        attributeKeys: ["attribute_3", "attribute_1", "attribute_2"],
        managedAttributeComponent: "MATERIAL_SAMPLE",
        type: "managed-attributes-view"
      }
    });
  });

  it("Lets you edit an existing form-template for managed attributes", async () => {
    const wrapper = mountWithAppContext(
      <ManagedAttributesViewEditPage />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Edit the name:
    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "edited name" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Existing Custom View saved:
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            createdBy: "poffm",
            createdOn: "2022-02-03",
            group: "test-group",
            id: "123",
            // The edited name:
            name: "edited name",
            restrictToCreatedBy: true,
            type: "form-template",
            viewConfiguration: {
              attributeKeys: ["attribute_1", "attribute_2"],
              managedAttributeComponent: "MATERIAL_SAMPLE",
              type: "managed-attributes-view"
            }
          },
          type: "form-template"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    expect(mockPush).lastCalledWith(
      "/collection/managed-attributes-view/view?id=123"
    );
  });

  it("Throws an error if you try to load a form-template that is not for a Managed Attribute View", async () => {
    mockQueryStringParams.id = "bad-form-template";

    const wrapper = mountWithAppContext(
      <ManagedAttributesViewEditPage />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Bad error message but this should not happen in prod unless an invalid link is followed.
    // The error is displayed instead of allowing you to edit a non-managed-attribute form-template in this page.
    expect(wrapper.find(".alert.alert-danger").text()).toEqual(
      "ValidationError: type must be one of the following values: managed-attributes-view"
    );
  });
});
