import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { ScheduledActionsField } from "../ScheduledActionsField";

const mockOnSubmit = jest.fn();

describe("ScheduledActionsField", () => {
  it("Edits the scheduled actions.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <ScheduledActionsField />
      </DinaForm>
    );

    // No actions initially:
    expect(wrapper.find(".ReactTable").exists()).toEqual(false);

    wrapper
      .find(".remarks-field textarea")
      .simulate("change", { target: { value: "remarks-1" } });
    wrapper.find("button.save-button").simulate("click");
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // One action added:
    expect(mockOnSubmit).lastCalledWith({
      scheduledActions: [{ remarks: "remarks-1" }]
    });

    // The table is shown now:
    expect(wrapper.find(".ReactTable").exists()).toEqual(true);
    expect(wrapper.find(".ReactTable .rt-tbody .rt-tr").length).toEqual(1);

    // Add a second Action:
    wrapper.find("button.add-new-button").simulate("click");
    wrapper
      .find(".remarks-field textarea")
      .simulate("change", { target: { value: "remarks-2" } });
    wrapper.find("button.save-button").simulate("click");

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Two actions added:
    expect(mockOnSubmit).lastCalledWith({
      scheduledActions: [{ remarks: "remarks-1" }, { remarks: "remarks-2" }]
    });

    expect(wrapper.find(".ReactTable .rt-tbody .rt-tr").length).toEqual(2);

    // Edit the first action:
    wrapper.find(".ReactTable .index-0 button.edit-button").simulate("click");
    wrapper
      .find(".remarks-field textarea")
      .simulate("change", { target: { value: "edited-remarks-1" } });
    wrapper.find("button.save-button").simulate("click");

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Two actions saved:
    expect(mockOnSubmit).lastCalledWith({
      scheduledActions: [
        { remarks: "edited-remarks-1" },
        { remarks: "remarks-2" }
      ]
    });

    // Remove the second action:
    wrapper.find(".ReactTable .index-1 button.remove-button").simulate("click");

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // One action saved:
    expect(mockOnSubmit).lastCalledWith({
      scheduledActions: [{ remarks: "edited-remarks-1" }]
    });
  });
});
