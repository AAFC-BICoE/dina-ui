import { KitsuResource } from "kitsu";
import { useEffect } from "react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { useGroupedCheckBoxes } from "../GroupedCheckBoxFields";

interface TestResource extends KitsuResource {
  name: string;
}

const TEST_SAMPLES: TestResource[] = [
  { id: 1, name: "1", type: "testResource" },
  { id: 2, name: "2", type: "testResource" },
  { id: 3, name: "3", type: "testResource" },
  { id: 4, name: "4", type: "testResource" },
  { id: 5, name: "5", type: "testResource" }
] as any[];

const mockOnSubmit = jest.fn();

function TestComponent() {
  const { CheckBoxHeader, CheckBoxField, setAvailableItems } =
    useGroupedCheckBoxes<any>({
      fieldName: "checkedIds"
    });

  useEffect(() => {
    setAvailableItems(TEST_SAMPLES);
  }, []);

  return (
    <DinaForm
      initialValues={{ checkedIds: {} }}
      onSubmit={async ({ submittedValues }) => mockOnSubmit(submittedValues)}
    >
      {TEST_SAMPLES.map((s) => (
        <CheckBoxField key={String(s.id)} resource={s} />
      ))}
      <CheckBoxHeader />
    </DinaForm>
  );
}

describe("Grouped check boxes hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders checkboxes.", () => {
    const wrapper = mountWithAppContext(<TestComponent />);
    expect(
      wrapper.find("CheckBoxField").find("input[type='checkbox']").length
    ).toEqual(5);
  });

  it("Sets the checked ID in the formik state.", async () => {
    const wrapper = mountWithAppContext(<TestComponent />);
    // Check the third checkbox.
    wrapper.find("input[type='checkbox']").at(2).prop<any>("onClick")({
      target: { checked: true }
    } as any);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockOnSubmit).lastCalledWith({ checkedIds: { "3": true } });
  });

  it("Lets you shift+click to toggle multiple check boxes at a time.", async () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    // Check the second checkbox.
    wrapper.find("input[type='checkbox']").at(1).prop<any>("onClick")({
      target: { checked: true }
    } as any);

    wrapper.update();

    // Shift+click the fourth checkbox.
    wrapper.find("input[type='checkbox']").at(3).prop<any>("onClick")({
      shiftKey: true,
      target: { checked: true }
    } as any);

    wrapper.update();

    // Boxes 2 to 4 should be checked.
    expect(
      wrapper
        .find("CheckBoxField")
        .find("input[type='checkbox']")
        .map((i) => i.prop("value"))
    ).toEqual([false, true, true, true, false]);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockOnSubmit).lastCalledWith({
      checkedIds: { "2": true, "3": true, "4": true }
    });
  });

  it("Multi-toggles checkboxes even when they are in reverse order.", async () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    // Click the fourth checkbox.
    wrapper.find("input[type='checkbox']").at(3).prop<any>("onClick")({
      target: { checked: true }
    } as any);
    wrapper.update();

    // Shift+click the second checkbox.
    wrapper.find("input[type='checkbox']").at(1).prop<any>("onClick")({
      shiftKey: true,
      target: { checked: true }
    } as any);
    wrapper.update();

    // Boxes 2 to 4 should be checked.
    expect(
      wrapper
        .find("CheckBoxField")
        .find("input[type='checkbox']")
        .map((i) => i.prop("value"))
    ).toEqual([false, true, true, true, false]);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockOnSubmit).lastCalledWith({
      checkedIds: { "2": true, "3": true, "4": true }
    });
  });

  it("Provides a checkbox to check all boxes.", async () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    // The header should show the total checked count.
    expect(wrapper.text().includes("(0 selected)")).toEqual(true);

    // Check the check-all box.
    wrapper.find("input.check-all-checkbox").prop<any>("onClick")({
      target: { checked: true }
    } as any);
    wrapper.update();

    // The header should show the total checked count.
    expect(wrapper.text().includes("(5 selected)")).toEqual(true);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockOnSubmit).lastCalledWith({
      checkedIds: { "1": true, "2": true, "3": true, "4": true, "5": true }
    });

    // Uncheck the check-all box.
    wrapper.find("input.check-all-checkbox").prop<any>("onClick")({
      target: { checked: false }
    } as any);
    wrapper.update();

    // The header should show the total checked count.
    expect(wrapper.text().includes("(0 selected)")).toEqual(true);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockOnSubmit).lastCalledWith({ checkedIds: {} });
  });
});
