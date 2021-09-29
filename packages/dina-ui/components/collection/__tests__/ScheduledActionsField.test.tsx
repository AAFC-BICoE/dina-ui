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
    wrapper.find("button.add-button").simulate("click");
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
    wrapper.find("button.add-button").simulate("click");

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Two actions added:
    expect(mockOnSubmit).lastCalledWith({
      scheduledActions: [{ remarks: "remarks-1" }, { remarks: "remarks-2" }]
    });

    expect(wrapper.find(".ReactTable .rt-tbody .rt-tr").length).toEqual(2);

    // Edit the first action:
  });
});
