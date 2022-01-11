import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { DinaForm } from "common-ui";
import { StorageLinkerField } from "../StorageLinker";

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/storage-unit/A":
      return {
        data: { id: "A", type: "storage-unit", name: "A" }
      };
    case "collection-api/storage-unit":
    case "collection-api/material-sample":
    case "collection-api/storage-unit-type":
      return { data: [], meta: { totalResourceCount: 0 } };
  }
});

const mockSave = jest.fn<any, any>();

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet
    },
    save: mockSave
  }
};

describe("StorageLinker", () => {
  it("Prompts to remove the empty Storage when the stored Material Sample has no ID. e.g. creation form.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          storageUnit: { id: "A", type: "storage-unit", name: "A" }
        }}
      >
        <StorageLinkerField name="storageUnit" targetType="material-sample" />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.remove-storage").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".modal-body .message-body").text()).toEqual(
      "Storage A is empty. Would you like to permanently delete this Storage Container?"
    );
    // Confirm "yes":
    wrapper.find(".modal-body form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Only the storage needs to be deleted:
    expect(mockSave).lastCalledWith(
      [{ delete: { id: "A", type: "storage-unit" } }],
      { apiBaseUrl: "/collection-api" }
    );
  });

  it("Prompts to remove the empty Storage when the stored Material Sample has an ID. e.g. edit form.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          id: "123",
          type: "material-sample",
          storageUnit: { id: "A", type: "storage-unit", name: "A" }
        }}
      >
        <StorageLinkerField name="storageUnit" targetType="material-sample" />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.remove-storage").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".modal-body .message-body").text()).toEqual(
      "Storage A is empty. Would you like to permanently delete this Storage Container?"
    );
    // Confirm "yes":
    wrapper.find(".modal-body form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Only the storage needs to be deleted:
    expect(mockSave).lastCalledWith(
      [
        // Detach the Material Sample:
        {
          resource: {
            id: "123",
            storageUnit: {
              id: null
            },
            type: "material-sample"
          },
          type: "material-sample"
        },
        // Delete the storage unit:
        {
          delete: {
            id: "A",
            type: "storage-unit"
          }
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
  });
});
