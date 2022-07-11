import ManagedAttributesViewListPage from "../../../pages/collection/managed-attributes-view/list";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import {
  FormTemplate,
  managedAttributesViewSchema
} from "../../../types/collection-api";

const TEST_CUSTOM_VIEWS: FormTemplate[] = [
  {
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
  }
];

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/form-template":
      return { data: TEST_CUSTOM_VIEWS };
  }
});

const testCtx = { apiContext: { apiClient: { get: mockGet } } };

describe("ManagedAttributesViewListPage", () => {
  it("Fetches the Custom Managed Attribute Views", async () => {
    const wrapper = mountWithAppContext(
      <ManagedAttributesViewListPage />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGet.mock.calls).toEqual([
      [
        "collection-api/form-template",
        expect.objectContaining({
          // The important part of the list query:
          // Filter by "managed-attributes-view" to omit unrelated form-template records:
          filter: {
            "viewConfiguration.type": "managed-attributes-view"
          }
        })
      ]
    ]);

    expect(wrapper.find(".managed-attributes-view-link").text()).toEqual(
      "Test Managed Attributes View"
    );
  });
});
