import { KitsuResource } from "kitsu";
import { useEffect } from "react";
import { mountWithAppContext } from "common-ui";
import { DinaForm } from "../DinaForm";
import { useGroupedCheckBoxes } from "../GroupedCheckBoxFields";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

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
    mountWithAppContext(<TestComponent />);
    // Find all checkbox inputs
    const checkboxes = screen.getAllByRole("checkbox", { name: /select/i });
    // Assert that 5 checkboxes are rendered
    expect(checkboxes).toHaveLength(5);
  });

  it("Sets the checked ID in the formik state.", async () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    const checkboxes = screen.getAllByRole("checkbox");
    await userEvent.click(checkboxes[2]);

    // Simulate form submission
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for the form submission to complete
    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalled());

    // Wait for the async actions to complete.
    await waitFor(() => {
      // Verify the mockOnSubmit was called with the expected values.
      expect(mockOnSubmit).toHaveBeenLastCalledWith({
        checkedIds: { "3": true }
      });
    });
  });

  it("Lets you shift+click to toggle multiple check boxes at a time.", async () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    const checkboxes = screen.getAllByRole("checkbox", { name: /select/i });

    // Check the second checkbox
    await userEvent.click(checkboxes[1]);

    // Shift+click the fourth checkbox to toggle multiple
    await userEvent.click(checkboxes[3], { shiftKey: true });

    // Assert that checkboxes 2 to 4 are checked (2nd to 4th checkboxes are true)
    expect(
      checkboxes.map((checkbox) => (checkbox as HTMLInputElement).checked)
    ).toEqual([false, true, true, true, false]);

    // Simulate form submission
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for the form submission to complete
    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalled());

    // Assert that the form was submitted with the correct checked IDs
    expect(mockOnSubmit).toHaveBeenLastCalledWith({
      checkedIds: { "2": true, "3": true, "4": true }
    });
  });

  it("Multi-toggles checkboxes even when they are in reverse order.", async () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    const checkboxes = screen.getAllByRole("checkbox", { name: /select/i });

    // Check the 4th checkbox
    await userEvent.click(checkboxes[3]);

    // Shift+click the 2 checkbox to toggle multiple
    await userEvent.click(checkboxes[1], { shiftKey: true });

    // Assert that checkboxes 2 to 4 are checked (2nd to 4th checkboxes are true)
    expect(
      checkboxes.map((checkbox) => (checkbox as HTMLInputElement).checked)
    ).toEqual([false, true, true, true, false]);

    // Simulate form submission
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for the form submission to complete
    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalled());

    // Assert that the form was submitted with the correct checked IDs
    expect(mockOnSubmit).toHaveBeenLastCalledWith({
      checkedIds: { "2": true, "3": true, "4": true }
    });
  });

  it("Provides a checkbox to check all boxes.", async () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    // The header should show the total checked count initially (0 selected).
    expect(screen.getByText("(0 selected)")).toBeInTheDocument();

    // Check the check-all box.
    const checkAllCheckbox = screen.getByRole("checkbox", {
      name: /check all/i
    });
    await userEvent.click(checkAllCheckbox);

    // The header should show the total checked count (5 selected).
    expect(screen.getByText("(5 selected)")).toBeInTheDocument();

    // Simulate form submission.
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for the form submission and async actions.
    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalled());

    // Verify the mockOnSubmit was called with the expected values.
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenLastCalledWith({
        checkedIds: { "1": true, "2": true, "3": true, "4": true, "5": true },
        selectAll: { checkedIds: true }
      });
    });

    // Uncheck the check-all box.
    await userEvent.click(checkAllCheckbox);

    // The header should show the total checked count as 0 selected.
    expect(screen.getByText("(0 selected)")).toBeInTheDocument();

    // Simulate form submission again.
    fireEvent.submit(form!);

    // Wait for the form submission and async actions.
    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalled());

    // Verify the mockOnSubmit was called with the expected values for unchecked.
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenLastCalledWith({
        checkedIds: {},
        selectAll: { checkedIds: false }
      });
    });
  });
});
