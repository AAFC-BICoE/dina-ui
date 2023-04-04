import { writeStorage } from "@rehooks/local-storage";
import { DinaForm, ResourceSelect } from "common-ui";
import Select from "react-select";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { ManagedAttribute } from "../../../../types/collection-api";
import {
  ATTRIBUTE_TEMPLATES_STORAGE_KEY,
  MetadataEditorAttributesControls,
  MetadataEditorControls
} from "../MetadataEditorAttributesControls";
const mockCtx = {
  apiClient: {
    async get() {
      return { data: [] };
    }
  }
};

const TEST_BUILT_IN_COLUMNS = [
  { data: "field-1", title: "Field 1" },
  { data: "field-2", title: "Field 2" },
  { data: "field-3", title: "Field 3" }
];

const TEST_MANAGED_ATTRIBUTES: ManagedAttribute[] = [
  {
    vocabularyElementType: "STRING",
    name: "managed-attribute-1",
    key: "managed-attribute-1",
    type: "managed-attribute"
  },
  {
    vocabularyElementType: "STRING",
    name: "managed-attribute-2",
    key: "managed-attribute-2",
    type: "managed-attribute"
  }
];

const initialFormControls: MetadataEditorControls = {
  attributesTemplate: null,
  editableBuiltInAttributes: TEST_BUILT_IN_COLUMNS.map((col) => col.data),
  editableManagedAttributes: TEST_MANAGED_ATTRIBUTES
};

describe("MetadataEditorAttributesControls component", () => {
  function getWrapper() {
    return mountWithAppContext(
      <DinaForm initialValues={initialFormControls}>
        <MetadataEditorAttributesControls
          builtInAttributes={TEST_BUILT_IN_COLUMNS}
        />
      </DinaForm>,
      { apiContext: mockCtx as any }
    );
  }

  async function getWrapperWithSavedTemplate() {
    const wrapper = getWrapper();

    // Set built-in attributes:
    wrapper
      .find(".editableBuiltInAttributes-field")
      .find(Select)
      .prop<any>("onChange")([{ value: TEST_BUILT_IN_COLUMNS[0].data }]);
    // Set managed attributes:
    wrapper
      .find(".editableManagedAttributes-field")
      .find(ResourceSelect)
      .prop<any>("onChange")([TEST_MANAGED_ATTRIBUTES[0]]);

    wrapper.find("button.template-save-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(".modal-content .name-field input").simulate("change", {
      target: { name: "name", value: "my-template" }
    });

    wrapper.find(".modal-content form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    return wrapper;
  }

  async function getWrapperWithSavedTempalteInUse() {
    const wrapper = await getWrapperWithSavedTemplate();

    // Set the template:
    const savedTemplate = wrapper
      .find("SelectField[name='attributesTemplate']")
      .prop<any>("options")[0];
    wrapper
      .find("SelectField[name='attributesTemplate']")
      .find(Select)
      .prop<any>("onChange")(savedTemplate);
    await new Promise(setImmediate);
    wrapper.update();

    return wrapper;
  }

  afterEach(() => {
    // Cleanup the local storage value:
    writeStorage(ATTRIBUTE_TEMPLATES_STORAGE_KEY, null);
  });

  it("Renders the layout controls.", () => {
    const wrapper = getWrapper();
    // Initial state has no saved templates:
    expect(
      wrapper.find("SelectField[name='attributesTemplate']").prop("options")
    ).toEqual([]);
  });

  it("Lets you save a template.", async () => {
    const wrapper = await getWrapperWithSavedTemplate();

    // The template should have been saved:
    expect(
      wrapper.find("SelectField[name='attributesTemplate']").prop("options")
    ).toEqual([
      {
        label: "my-template",
        value: {
          editableBuiltInAttributes: ["field-1"],
          editableManagedAttributes: [
            {
              key: "managed-attribute-1",
              vocabularyElementType: "STRING",
              name: "managed-attribute-1",
              type: "managed-attribute"
            }
          ],
          name: "my-template"
        }
      }
    ]);
  });

  it("Lets you select a saved template.", async () => {
    const wrapper = await getWrapperWithSavedTempalteInUse();

    // The built-in attribute is set:
    expect(
      wrapper
        .find(".editableBuiltInAttributes-field")
        .find(Select)
        .prop("value")
    ).toEqual([
      {
        label: "Field 1",
        value: "field-1"
      }
    ]);
    // The managed attribute is set:
    expect(
      wrapper
        .find(".editableManagedAttributes-field")
        .find(ResourceSelect)
        .prop("value")
    ).toEqual([
      {
        key: "managed-attribute-1",
        vocabularyElementType: "STRING",
        name: "managed-attribute-1",
        type: "managed-attribute"
      }
    ]);
  });

  it("Lets you delete a saved template", async () => {
    const wrapper = await getWrapperWithSavedTempalteInUse();

    // Click delete button:
    wrapper.find("button.template-delete-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // There should be no more saved templates:
    expect(
      wrapper
        .find("SelectField[name='attributesTemplate']")
        .prop<any>("options")
    ).toEqual([]);
  });

  it("Lets you reset to the initial editable attributes.", async () => {
    const wrapper = await getWrapperWithSavedTempalteInUse();

    // Click reset button:
    wrapper.find("button.template-reset-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // The built-in attributes are set:
    expect(
      wrapper
        .find(".editableBuiltInAttributes-field")
        .find(Select)
        .prop("value")
    ).toEqual([
      {
        label: "Field 1",
        value: "field-1"
      },
      {
        label: "Field 2",
        value: "field-2"
      },
      {
        label: "Field 3",
        value: "field-3"
      }
    ]);
    // The managed attributes are set:
    expect(
      wrapper
        .find(".editableManagedAttributes-field")
        .find(ResourceSelect)
        .prop("value")
    ).toEqual(TEST_MANAGED_ATTRIBUTES);
  });
});
