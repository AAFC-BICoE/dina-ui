import { mount } from "enzyme";
import { Form, Formik } from "formik";
import { useEffect } from "react";
import { useGroupedCheckBoxes } from "../GroupedCheckBoxFields";
import { KitsuResource } from "kitsu";

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
  const {
    CheckBoxHeader,
    CheckBoxField,
    setAvailableItems
  } = useGroupedCheckBoxes<any>({
    fieldName: "checkedIds"
  });

  useEffect(() => {
    setAvailableItems(TEST_SAMPLES);
  }, []);

  return (
    <Formik initialValues={{ checkedIds: {} }} onSubmit={mockOnSubmit}>
      <Form>
        {TEST_SAMPLES.map(s => (
          <CheckBoxField key={s.id} resource={s} />
        ))}
        <CheckBoxHeader />
      </Form>
    </Formik>
  );
}

describe("Grouped check boxes hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders checkboxes.", () => {
    const wrapper = mount(<TestComponent />);
    expect(
      wrapper.find("CheckBoxField").find("input[type='checkbox']").length
    ).toEqual(5);
  });

  it("Sets the checked ID in the formik state.", async () => {
    const wrapper = mount(<TestComponent />);
    // Check the third checkbox.
    wrapper
      .find("input[type='checkbox']")
      .at(2)
      .prop("onClick")({ target: { checked: true } } as any);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockOnSubmit).lastCalledWith(
      { checkedIds: { "3": true } },
      expect.anything()
    );
  });

  it("Lets you shift+click to toggle multiple check boxes at a time.", async () => {
    const wrapper = mount(<TestComponent />);

    // Check the second checkbox.
    wrapper
      .find("input[type='checkbox']")
      .at(1)
      .prop("onClick")({ target: { checked: true } } as any);

    wrapper.update();

    // Shift+click the fourth checkbox.
    wrapper
      .find("input[type='checkbox']")
      .at(3)
      .prop("onClick")({ shiftKey: true, target: { checked: true } } as any);

    wrapper.update();

    // Boxes 2 to 4 should be checked.
    expect(
      wrapper
        .find("CheckBoxField")
        .find("input[type='checkbox']")
        .map(i => i.prop("value"))
    ).toEqual([false, true, true, true, false]);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockOnSubmit).lastCalledWith(
      { checkedIds: { "2": true, "3": true, "4": true } },
      expect.anything()
    );
  });

  it("Multi-toggles checkboxes even when they are in reverse order.", async () => {
    const wrapper = mount(<TestComponent />);

    // Click the fourth checkbox.
    wrapper
      .find("input[type='checkbox']")
      .at(3)
      .prop("onClick")({ target: { checked: true } } as any);
    wrapper.update();

    // Shift+click the second checkbox.
    wrapper
      .find("input[type='checkbox']")
      .at(1)
      .prop("onClick")({ shiftKey: true, target: { checked: true } } as any);
    wrapper.update();

    // Boxes 2 to 4 should be checked.
    expect(
      wrapper
        .find("CheckBoxField")
        .find("input[type='checkbox']")
        .map(i => i.prop("value"))
    ).toEqual([false, true, true, true, false]);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockOnSubmit).lastCalledWith(
      { checkedIds: { "2": true, "3": true, "4": true } },
      expect.anything()
    );
  });

  it("Provides a checkbox to check all boxes.", async () => {
    const wrapper = mount(<TestComponent />);

    // The header should show the total checked count.
    expect(wrapper.text().includes("(0 selected)")).toEqual(true);

    // Check the check-all box.
    wrapper.find("input.check-all-checkbox").prop("onClick")({
      target: { checked: true }
    } as any);
    wrapper.update();

    // The header should show the total checked count.
    expect(wrapper.text().includes("(5 selected)")).toEqual(true);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockOnSubmit).lastCalledWith(
      { checkedIds: { "1": true, "2": true, "3": true, "4": true, "5": true } },
      expect.anything()
    );

    // Uncheck the check-all box.
    wrapper.find("input.check-all-checkbox").prop("onClick")({
      target: { checked: false }
    } as any);
    wrapper.update();

    // The header should show the total checked count.
    expect(wrapper.text().includes("(0 selected)")).toEqual(true);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockOnSubmit).lastCalledWith({ checkedIds: {} }, expect.anything());
  });
});
