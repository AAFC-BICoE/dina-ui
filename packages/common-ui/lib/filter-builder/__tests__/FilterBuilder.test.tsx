import { useEffect, useState } from "react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { FilterBuilder, FilterBuilderProps } from "../FilterBuilder";
import { FilterGroupModel } from "../FilterGroup";
import "@testing-library/jest-dom";
import { screen, fireEvent } from "@testing-library/react";

describe("FilterBuilder component", () => {
  const filterAttributes = ["name", "description"];

  function mountFilterBuilder(propsOverride: Partial<FilterBuilderProps> = {}) {
    return mountWithAppContext(
      <FilterBuilder filterAttributes={filterAttributes} {...propsOverride} />
    );
  }

  it("Renders initially with one FilterRow.", () => {
    const wrapper = mountFilterBuilder();

    // Name to be selected.
    expect(wrapper.getByText(/name/i)).toBeInTheDocument();

    // IS Predicate
    expect(wrapper.getByText(/is/i)).toBeInTheDocument();

    // Partial match to be selected.
    expect(wrapper.getByText(/partial match/i)).toBeInTheDocument();
  });

  it("Adds a FilterRow in an AND group when the FilterRow's AND button is clicked.", () => {
    const wrapper = mountFilterBuilder();

    // Click the AND button...
    const andButton = wrapper.getByRole("button", { name: /and/i });
    fireEvent.click(andButton);

    // Expect 2 names.
    expect(wrapper.getAllByText(/name/i).length).toBe(2);

    // Expect 2 IS Predicate
    expect(wrapper.getAllByText(/is/i).length).toBe(2);

    // Expect 2 Partial match to be selected.
    expect(wrapper.getAllByText(/partial match/i).length).toBe(2);
  });

  it("Adds a FilterRow in an OR group when the FilterRow's OR button is clicked.", () => {
    const wrapper = mountFilterBuilder();

    // Click the OR button...
    const orButton = wrapper.getByRole("button", { name: /or/i });
    fireEvent.click(orButton);

    // Expect 2 names.
    expect(wrapper.getAllByText(/name/i).length).toBe(2);

    // Expect 2 IS Predicate
    expect(wrapper.getAllByText(/is/i).length).toBe(2);

    // Expect 2 Partial match to be selected.
    expect(wrapper.getAllByText(/partial match/i).length).toBe(2);
  });

  it("Nests filter groups.", () => {
    const wrapper = mountFilterBuilder();

    // Click the OR button...
    const orButton = wrapper.getByRole("button", { name: /or/i });
    fireEvent.click(orButton);

    // Find the 2nd AND button and click it.
    const andButtons = screen.getAllByRole("button", { name: /and/i });
    fireEvent.click(andButtons[1]);

    // Expect 3 names.
    expect(wrapper.getAllByText(/name/i).length).toBe(3);

    // Expect 3 IS Predicate
    expect(wrapper.getAllByText(/is/i).length).toBe(3);

    // Expect 3 Partial match to be selected.
    expect(wrapper.getAllByText(/partial match/i).length).toBe(3);
  });

  it("Inserts a new filter row immediately after the clicked AND button's row.", () => {
    const wrapper = mountFilterBuilder();

    // Click the AND button...
    const andButton = wrapper.getByRole("button", { name: /and/i });
    fireEvent.click(andButton);

    const textboxes = wrapper.getAllByRole("textbox", {
      name: /filter value/i
    });
    fireEvent.change(textboxes[0], { target: { value: "first filter value" } });
    fireEvent.change(textboxes[1], {
      target: { value: "second filter value" }
    });

    // Click the first filter row's button again.
    fireEvent.click(andButton);

    // The blank filter row should be inserted between the two existing filter rows.
    const textboxesAgain = wrapper.getAllByRole("textbox", {
      name: /filter value/i
    }) as HTMLInputElement[];
    expect(textboxesAgain[0].value).toEqual("first filter value");
    expect(textboxesAgain[1].value).toEqual("");
    expect(textboxesAgain[2].value).toEqual("second filter value");
  });

  it("Removes a filter row when the '-' button is clicked.", () => {
    const wrapper = mountFilterBuilder();

    // Click the AND button...
    const andButton = wrapper.getByRole("button", { name: /and/i });
    fireEvent.click(andButton);

    const textboxes = wrapper.getAllByRole("textbox", {
      name: /filter value/i
    });
    fireEvent.change(textboxes[0], { target: { value: "first filter value" } });
    fireEvent.change(textboxes[1], {
      target: { value: "second filter value" }
    });

    // Click the first row's "-" button.
    const deleteRowButton = wrapper.getAllByRole("button", { name: /\-/i })[0];
    fireEvent.click(deleteRowButton);

    // The second filter should only exist since we deleted the first one.
    const textboxesAgain = wrapper.getAllByRole("textbox", {
      name: /filter value/i
    }) as HTMLInputElement[];
    expect(textboxesAgain.length).toBe(1);
    expect(textboxesAgain[0].value).toEqual("second filter value");
  });

  it("Removes a filter group that only has one child after a filter row is removed.", () => {
    const wrapper = mountFilterBuilder();

    // Click the AND button of the first filter row
    const firstAndButton = wrapper.getByRole("button", { name: /and/i });
    fireEvent.click(firstAndButton);

    // Click the OR button of the second filter row
    const secondOrButton = wrapper.getAllByRole("button", { name: /or/i })[1];
    fireEvent.click(secondOrButton);

    // Insert text into all the text fields.
    const textboxes = wrapper.getAllByRole("textbox", {
      name: /filter value/i
    });
    fireEvent.change(textboxes[0], { target: { value: "first filter value" } });
    fireEvent.change(textboxes[1], {
      target: { value: "second filter value" }
    });
    fireEvent.change(textboxes[2], { target: { value: "third filter value" } });

    // Click the "-" button of the third filter row
    const thirdDeleteButton = wrapper.getAllByRole("button", { name: /-/i })[2];
    fireEvent.click(thirdDeleteButton);

    const textboxesAgain = wrapper.getAllByRole("textbox", {
      name: /filter value/i
    }) as HTMLInputElement[];
    expect(textboxesAgain[0].value).toEqual("first filter value");
    expect(textboxesAgain[1].value).toEqual("second filter value");
    expect(textboxesAgain.length).toBe(2);
  });

  it("Hides the FilterRow's Remove button when there is only one FilterRow.", () => {
    const wrapper = mountFilterBuilder();

    const deleteButtons = wrapper.queryAllByRole("button", { name: /-/i });
    expect(deleteButtons.length).toBe(0);
  });

  it("Hides the FilterGroup's remove button when it is the top-level group.", () => {
    const wrapper = mountFilterBuilder();

    // Top-level group shouldn't have a remove button
    const removeButton = wrapper.queryByRole("button", { name: /-/i });
    expect(removeButton).toBeNull();

    // Click the first AND button to create a nested group
    const firstAndButton = wrapper.getByRole("button", { name: /and/i });
    fireEvent.click(firstAndButton);

    // Click the OR button to create a complex structure
    const secondOrButton = wrapper.getAllByRole("button", { name: /or/i })[1];
    fireEvent.click(secondOrButton);

    // 3 delete buttons for each row, and one for the lower group.
    expect(wrapper.queryAllByRole("button", { name: /-/i }).length).toBe(4);
    expect(wrapper.getAllByTestId("group-delete-button").length).toBe(1);
  });

  it("Removes a filter group when the '-' button is clicked.", () => {
    const wrapper = mountFilterBuilder();

    // Click the first AND button to create a nested group
    const firstAndButton = wrapper.getByRole("button", { name: /and/i });
    fireEvent.click(firstAndButton);

    // Click the OR button to create a complex structure
    const secondOrButton = wrapper.getAllByRole("button", { name: /or/i })[1];
    fireEvent.click(secondOrButton);

    // Click the group remove button.
    fireEvent.click(wrapper.getByTestId("group-delete-button"));

    const textboxesAgain = wrapper.getAllByRole("textbox", {
      name: /filter value/i
    });
    expect(textboxesAgain.length).toBe(1);
  });

  it("Provides an 'onChange' callback prop that provides the filter model.", async () => {
    const onChange = jest.fn();

    const wrapper = mountFilterBuilder({ onChange });

    // Change a text input
    const firstInput = wrapper.getByRole("textbox", { name: /filter value/i });
    fireEvent.change(firstInput, { target: { value: "first filter value" } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).lastCalledWith({
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: "first filter value"
        }
      ],
      id: 2,
      operator: "AND",
      type: "FILTER_GROUP"
    });

    // Click the AND button
    const firstAndButton = wrapper.getByRole("button", { name: /and/i });
    fireEvent.click(firstAndButton);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).lastCalledWith({
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: "first filter value"
        },
        {
          attribute: "name",
          id: 3,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: ""
        }
      ],
      id: 2,
      operator: "AND",
      type: "FILTER_GROUP"
    });

    // Click the OR button
    const orButton = wrapper.getAllByRole("button", { name: /or/i })[1];
    fireEvent.click(orButton);
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).lastCalledWith({
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: "first filter value"
        },
        {
          children: [
            {
              attribute: "name",
              id: 3,
              predicate: "IS",
              searchType: "PARTIAL_MATCH",
              type: "FILTER_ROW",
              value: ""
            },
            {
              attribute: "name",
              id: 4,
              predicate: "IS",
              searchType: "PARTIAL_MATCH",
              type: "FILTER_ROW",
              value: ""
            }
          ],
          id: 5,
          operator: "OR",
          type: "FILTER_GROUP"
        }
      ],
      id: 2,
      operator: "AND",
      type: "FILTER_GROUP"
    });

    // Click the "-" button
    const firstDeleteButton = wrapper.getAllByRole("button", { name: /-/i })[0];
    fireEvent.click(firstDeleteButton);
    expect(onChange).toHaveBeenCalledTimes(4);
    expect(onChange).lastCalledWith({
      children: [
        {
          attribute: "name",
          id: 3,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: ""
        },
        {
          attribute: "name",
          id: 4,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: ""
        }
      ],
      id: 5,
      operator: "OR",
      type: "FILTER_GROUP"
    });
  });

  it("Resets to the initial state when a null value is passed.", async () => {
    const callback = jest.fn(); // Mock the callback function
    function TestComponent() {
      const [model, setModel] = useState<FilterGroupModel | null>(null);

      useEffect(() => {
        callback(model);
      }, [model]);

      return (
        <>
          <FilterBuilder
            filterAttributes={filterAttributes}
            onChange={setModel}
            value={model}
          />
          <button onClick={() => setModel(null)}>reset to null</button>
        </>
      );
    }

    const wrapper = mountWithAppContext(<TestComponent />);
    expect(callback).lastCalledWith(null);

    await new Promise(setImmediate);
    expect(callback).lastCalledWith({
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: ""
        }
      ],
      id: 2,
      operator: "AND",
      type: "FILTER_GROUP"
    });

    // Set the model to null.
    fireEvent.click(wrapper.getByRole("button", { name: /reset to null/i }));
    await new Promise(setImmediate);
    await new Promise(setImmediate);

    // Resets itself with the inital filter model.
    expect(callback).toHaveBeenCalledTimes(4);
    expect(callback).lastCalledWith({
      children: [
        {
          attribute: "name",
          id: 3,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: ""
        }
      ],
      id: 4,
      operator: "AND",
      type: "FILTER_GROUP"
    });
  });
});
