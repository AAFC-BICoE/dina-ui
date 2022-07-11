import { deleteFromStorage, writeStorage } from "@rehooks/local-storage";
import { ResourceSelect } from "common-ui";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { SortableNavGroup } from "../../material-sample/material-sample-form-nav/MaterialSampleFormNav";
import { LAST_USED_ID_STORAGE_KEY } from "../../material-sample/material-sample-form-nav/MaterialSampleNavFormTemplateSelect";
import { MaterialSampleForm } from "../../material-sample/MaterialSampleForm";

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/form-template/123":
      return {
        data: {
          id: "123",
          type: "form-template",
          name: "persisted-view",
          createdBy: "test-user",
          viewConfiguration: {
            type: "material-sample-form-section-order",
            navOrder: ["material-sample-info-section", "identifiers-section"]
          }
        }
      };
    case "user-api/group":
    case "objectstore-api/metadata":
    case "collection-api/collection":
    case "collection-api/managed-attribute":
    case "collection-api/material-sample-type":
    case "collection-api/project":
    case "collection-api/material-sample":
    case "collection-api/form-template":
    case "collection-api/vocabulary/materialSampleState":
      return { data: [] };
  }
});

const mockSave = jest.fn(async saves => {
  return saves.map(save => ({
    ...save.resource,
    createdBy: "test-user",
    id: save.resource.id ?? "123"
  }));
});

const mockDoOperations = jest.fn();

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map(path => {
    switch (path) {
    }
  })
);

const apiContext = {
  save: mockSave,
  doOperations: mockDoOperations,
  bulkGet: mockBulkGet,
  apiClient: {
    get: mockGet
  }
};

const testCtx = { apiContext };

describe("MaterialSampleFormNav", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset local storage:
    deleteFromStorage(LAST_USED_ID_STORAGE_KEY);
  });

  it("Lets you rearrange the form sections using the navigator and save your custom view.", async () => {
    const wrapper = mountWithAppContext(<MaterialSampleForm />, testCtx);

    await new Promise(setImmediate);
    wrapper.update();

    // Set the Material Sample's group:
    wrapper.find(".group-field Select").prop<any>("onChange")({
      label: "group",
      value: "test group"
    });

    // Initially shows the default order: "Identifiers" then "Material Sample Info":
    const listItemsBefore = wrapper.find(
      ".material-sample-nav .list-group-item"
    );
    expect(
      [listItemsBefore.at(0), listItemsBefore.at(1)].map(item => item.text())
    ).toEqual(["Identifiers", "Material Sample Info"]);

    // Doesn't show the save button:
    expect(
      wrapper.find(".material-sample-nav button.save-this-view").exists()
    ).toEqual(false);

    // Simulate a sort event:
    wrapper.find(SortableNavGroup).prop<any>("onSortEnd")({
      oldIndex: 1,
      newIndex: 0
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Shows the changed order: "Material Sample Info" then "Identifiers":
    const listItemsAfter = wrapper.find(
      ".material-sample-nav .list-group-item"
    );
    expect(
      [listItemsAfter.at(0), listItemsAfter.at(1)].map(item => item.text())
    ).toEqual(["Material Sample Info", "Identifiers"]);

    // The form shows the components in the new order:
    expect(
      wrapper
        .find(".data-components")
        .children()
        .slice(0, 2)
        .map(node => node.prop("id"))
    ).toEqual(["material-sample-info-section", "identifiers-section"]);

    wrapper
      .find(".material-sample-nav button.save-this-view")
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Set a name in the modal:
    wrapper
      .find(".modal-body .save-new-view-form .name-field input")
      .simulate("change", { target: { value: "my new view" } });
    // Submit the modal form:
    wrapper.find(".modal-body .save-new-view-form form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              group: "test group",
              name: "my new view",
              restrictToCreatedBy: false,
              type: "form-template",
              viewConfiguration: {
                navOrder: expect.arrayContaining([]),
                type: "material-sample-form-section-order"
              }
            },
            type: "form-template"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);

    // The changed nav order was saved:
    expect(
      mockSave.mock.calls[0][0][0].resource.viewConfiguration.navOrder.slice(
        0,
        2
      )
    ).toEqual([
      "material-sample-info-section", // Was Moved
      "identifiers-section" // Was Moved
    ]);

    // The saved Custom View is set into the Select input:
    expect(
      wrapper.find(".material-sample-nav").find(ResourceSelect).prop("value")
    ).toEqual({
      group: "test group",
      id: "123",
      name: "my new view",
      restrictToCreatedBy: false,
      createdBy: "test-user",
      type: "form-template",
      viewConfiguration: {
        navOrder: expect.arrayContaining([]),
        type: "material-sample-form-section-order"
      }
    });

    // Shows a delete button:
    expect(
      wrapper.find(".material-sample-nav button.delete-view").exists()
    ).toEqual(true);
  });

  it("Lets you select the last used Custom View", async () => {
    writeStorage(LAST_USED_ID_STORAGE_KEY, "123");

    const wrapper = mountWithAppContext(<MaterialSampleForm />, testCtx);

    await new Promise(setImmediate);
    wrapper.update();

    // Set the Material Sample's group:
    wrapper.find(".group-field Select").prop<any>("onChange")({
      label: "group",
      value: "test group"
    });

    await new Promise(setImmediate);
    wrapper.update();

    const lastUsedButton = wrapper.find(
      ".material-sample-nav button.use-last-selected-view"
    );

    expect(lastUsedButton.text()).toEqual(
      "Use Last Selected Order View: persisted-view"
    );
    lastUsedButton.simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // The last used Custom View is set again:
    expect(
      wrapper.find(".material-sample-nav").find(ResourceSelect).prop("value")
    ).toEqual({
      id: "123",
      name: "persisted-view",
      type: "form-template",
      createdBy: "test-user",
      viewConfiguration: {
        navOrder: ["material-sample-info-section", "identifiers-section"],
        type: "material-sample-form-section-order"
      }
    });
  });

  it("Lets you edit an existing Custom View", async () => {
    writeStorage(LAST_USED_ID_STORAGE_KEY, "123");

    const wrapper = mountWithAppContext(<MaterialSampleForm />, testCtx);

    await new Promise(setImmediate);
    wrapper.update();

    // Set the Material Sample's group:
    wrapper.find(".group-field Select").prop<any>("onChange")({
      label: "group",
      value: "test group"
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Select the last used Custom View:
    wrapper
      .find(".material-sample-nav button.use-last-selected-view")
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // The last used Custom View is set again:
    expect(
      wrapper.find(".material-sample-nav").find(ResourceSelect).prop("value")
    ).toEqual(
      expect.objectContaining({
        id: "123",
        name: "persisted-view",
        createdBy: "test-user",
        viewConfiguration: {
          navOrder: ["material-sample-info-section", "identifiers-section"],
          type: "material-sample-form-section-order"
        }
      })
    );

    // Simulate an order change:
    wrapper.find(SortableNavGroup).prop<any>("onSortEnd")({
      oldIndex: 1,
      newIndex: 0
    });

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".material-sample-nav button.save-this-view")
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".modal-body .save-existing-view-form form")
      .simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // The new viewConfiguration is saved:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "123",
              type: "form-template",
              viewConfiguration: {
                navOrder: expect.arrayContaining([]),
                type: "material-sample-form-section-order"
              }
            },
            type: "form-template"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
    // The changed nav order was saved:
    expect(
      mockSave.mock.calls[0][0][0].resource.viewConfiguration.navOrder.slice(
        0,
        2
      )
    ).toEqual([
      "identifiers-section", // Was Moved
      "material-sample-info-section" // Was Moved
    ]);
  });

  it("Lets you delete an existing Custom View", async () => {
    writeStorage(LAST_USED_ID_STORAGE_KEY, "123");

    const wrapper = mountWithAppContext(<MaterialSampleForm />, testCtx);

    await new Promise(setImmediate);
    wrapper.update();

    // Set the Material Sample's group:
    wrapper.find(".group-field Select").prop<any>("onChange")({
      label: "group",
      value: "test group"
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Select the last used Custom View to use the Stored Last Selected ID:
    wrapper
      .find(".material-sample-nav button.use-last-selected-view")
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(".material-sample-nav button.delete-view").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(".modal-body form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockDoOperations.mock.calls).toEqual([
      [
        [{ op: "DELETE", path: "form-template/123" }],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);

    // The saved Custom View removed:
    expect(
      wrapper.find(".material-sample-nav").find(ResourceSelect).prop("value")
    ).toEqual({ id: null });

    // The Last Selected button is gone:
    expect(wrapper.find("button.use-last-selected-view").exists()).toEqual(
      false
    );
  });
});
