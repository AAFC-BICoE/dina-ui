import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { ScheduledActionsField } from "../ScheduledActionsField";

const mockOnSubmit = jest.fn();

const mockBulkGet = jest.fn<any, any>(async (paths) => {
  if (!paths.length) {
    return [];
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: (path) => {
        switch (path) {
          case "user-api/user":
          case "collection-api/material-sample":
            return { data: [] };
        }
      }
    } as any,
    bulkGet: mockBulkGet
  }
};

describe("ScheduledActionsField", () => {
  it("Edits the scheduled actions.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <ScheduledActionsField defaultDate="2021-10-12" />
      </DinaForm>,
      testCtx
    );

    // No actions initially:
    expect(wrapper.find(".ReactTable").exists()).toEqual(false);

    // Add first action:
    wrapper
      .find(".actionType-field input")
      .simulate("change", { target: { value: "at1" } });
    wrapper
      .find(".actionStatus-field input")
      .simulate("change", { target: { value: "as1" } });
    wrapper
      .find(".remarks-field textarea")
      .simulate("change", { target: { value: "remarks-1" } });
    wrapper.find("button.add-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // One action added:
    expect(mockOnSubmit).lastCalledWith({
      scheduledActions: [
        {
          actionType: "at1",
          actionStatus: "as1",
          date: "2021-10-12",
          remarks: "remarks-1"
        }
      ]
    });

    // The table is shown now:
    expect(wrapper.find(".ReactTable").exists()).toEqual(true);
    expect(wrapper.find(".ReactTable tbody tr").length).toEqual(1);

    // Add a second Action:
    wrapper.find("button.add-new-button").simulate("click");
    wrapper
      .find(".actionType-field input")
      .simulate("change", { target: { value: "at2" } });
    wrapper
      .find(".actionStatus-field input")
      .simulate("change", { target: { value: "as2" } });
    wrapper
      .find(".remarks-field textarea")
      .simulate("change", { target: { value: "remarks-2" } });
    wrapper.find("button.add-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Two actions added:
    expect(mockOnSubmit).lastCalledWith({
      scheduledActions: [
        {
          actionType: "at1",
          actionStatus: "as1",
          date: "2021-10-12",
          remarks: "remarks-1"
        },
        {
          actionType: "at2",
          actionStatus: "as2",
          date: "2021-10-12",
          remarks: "remarks-2"
        }
      ]
    });

    expect(wrapper.find(".ReactTable tbody tr").length).toEqual(2);

    // Edit the first action:
    wrapper.find(".ReactTable .index-0 button.edit-button").simulate("click");
    wrapper
      .find(".remarks-field textarea")
      .simulate("change", { target: { value: "edited-remarks-1" } });
    wrapper.find("button.add-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Two actions saved:
    expect(mockOnSubmit).lastCalledWith({
      scheduledActions: [
        {
          actionType: "at1",
          actionStatus: "as1",
          date: "2021-10-12",
          remarks: "edited-remarks-1"
        },
        {
          actionType: "at2",
          actionStatus: "as2",
          date: "2021-10-12",
          remarks: "remarks-2"
        }
      ]
    });

    // Remove the second action:
    wrapper.find(".ReactTable .index-1 button.remove-button").simulate("click");

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // One action saved:
    expect(mockOnSubmit).lastCalledWith({
      scheduledActions: [
        {
          actionType: "at1",
          actionStatus: "as1",
          date: "2021-10-12",
          remarks: "edited-remarks-1"
        }
      ]
    });
  });
});
