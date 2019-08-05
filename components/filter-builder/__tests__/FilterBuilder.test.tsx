import { mount } from "enzyme";
import { useState } from "react";
import { act } from "react-test-renderer";
import { FilterBuilder, FilterBuilderProps } from "../FilterBuilder";
import { FilterGroup } from "../FilterGroup";
import { FilterRow } from "../FilterRow";

describe("FilterBuilder component", () => {
  const { objectContaining } = expect;

  const filterAttributes = ["name", "description"];

  function mountFilterBuilder(propsOverride: Partial<FilterBuilderProps> = {}) {
    return mount<FilterBuilder>(
      <FilterBuilder filterAttributes={filterAttributes} {...propsOverride} />
    );
  }

  it("Renders initially with one FilterRow.", () => {
    const wrapper = mountFilterBuilder();

    expect(wrapper.state().model).toEqual({
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
    expect(wrapper.find(FilterRow).length).toEqual(1);
  });

  it("Adds a FilterRow in an AND group when the FilterRow's AND button is clicked.", () => {
    const wrapper = mountFilterBuilder();

    wrapper
      .find(".filter-row-buttons button[children='AND']")
      .simulate("click");

    expect(wrapper.state().model).toEqual({
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: ""
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
    expect(wrapper.find(FilterGroup).find(FilterRow).length).toEqual(2);
  });

  it("Adds a FilterRow in an OR group when the FilterRow's OR button is clicked.", () => {
    const wrapper = mountFilterBuilder();

    wrapper.find(".filter-row-buttons button[children='OR']").simulate("click");

    expect(wrapper.state().model).toEqual({
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: ""
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
      id: 4,
      operator: "OR",
      type: "FILTER_GROUP"
    });
    expect(wrapper.find(FilterGroup).find(FilterRow).length).toEqual(2);
  });

  it("Nests filter groups.", () => {
    const wrapper = mountFilterBuilder();

    wrapper
      .find(".filter-row-buttons button[children='AND']")
      .simulate("click");

    wrapper
      .find(FilterRow)
      .at(1)
      .find("button[children='OR']")
      .simulate("click");

    expect(wrapper.state().model).toEqual({
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: ""
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

    expect(wrapper.find(FilterGroup).length).toEqual(2);
    expect(wrapper.find(FilterRow).length).toEqual(3);
  });

  it("Inserts a new filter row immediately after the clicked AND button's row.", () => {
    const wrapper = mountFilterBuilder();

    // Click the first filter row's button.
    wrapper.find("button[children='AND']").simulate("click");

    wrapper
      .find("input.filter-value")
      .first()
      .simulate("change", { target: { value: "first filter value" } });

    wrapper
      .find("input.filter-value")
      .at(1)
      .simulate("change", { target: { value: "second filter value" } });

    // Click the first filter row's button again.
    wrapper
      .find("button[children='AND']")
      .first()
      .simulate("click");

    // The blank filter row should be inserted between the two existing filter rows.
    expect(
      wrapper
        .find("input.filter-value")
        .map((input: any) => input.instance().value)
    ).toEqual(["first filter value", "", "second filter value"]);

    // Expect the same action was taken on the component's model.
    expect(wrapper.state().model).toEqual(
      objectContaining({
        children: [
          objectContaining({ value: "first filter value" }),
          objectContaining({ value: "" }),
          objectContaining({ value: "second filter value" })
        ]
      })
    );
  });

  it("Removes a filter row when the '-' button is clicked.", () => {
    const wrapper = mountFilterBuilder();

    wrapper.find("button[children='AND']").simulate("click");

    const filterValueInputs = wrapper.find("input.filter-value");
    filterValueInputs
      .at(0)
      .simulate("change", { target: { value: "first filter value" } });
    filterValueInputs
      .at(1)
      .simulate("change", { target: { value: "second filter value" } });

    // Click the first row's "-" button.
    wrapper
      .find("button[children='-']")
      .first()
      .simulate("click");

    // The second filter row should be the only one left.
    expect(wrapper.find(FilterRow).length).toEqual(1);

    expect(
      (wrapper.find("input.filter-value").instance() as any).value
    ).toEqual("second filter value");

    expect(wrapper.state().model).toEqual(
      objectContaining({
        children: [objectContaining({ value: "second filter value" })]
      })
    );
  });

  it("Removes a filter group that only has one child after a filter row is removed.", () => {
    const wrapper = mountFilterBuilder();

    // Click the initial FilterRow's AND button.
    wrapper
      .find(FilterRow)
      .at(0)
      .find("button[children='AND']")
      .simulate("click");

    // Click the second FilterRow's OR button.
    wrapper
      .find(FilterRow)
      .at(1)
      .find("button[children='OR']")
      .simulate("click");

    // Click the third FilterRow's "-" button.
    wrapper
      .find(FilterRow)
      .at(2)
      .find("button[children='-']")
      .simulate("click");

    // There should be two filter rows in one AND group.
    expect(wrapper.state().model).toEqual(
      objectContaining({
        children: [
          objectContaining({ type: "FILTER_ROW" }),
          objectContaining({ type: "FILTER_ROW" })
        ],
        operator: "AND",
        type: "FILTER_GROUP"
      })
    );
  });

  it("Hides the FilterRow's Remove button when there is only one FilterRow.", () => {
    const wrapper = mountFilterBuilder();
    expect(wrapper.find(FilterRow).length).toEqual(1);
    expect(wrapper.find("button[children='-']").exists()).toEqual(false);
  });

  it("Hides the FilterGroup's remove button when it is the top-level group.", () => {
    const wrapper = mountFilterBuilder();

    // Hides the group's remove button when the filter group is the top-level group.
    expect(wrapper.find(FilterGroup).length).toEqual(1);
    expect(
      wrapper.find(".filter-group-buttons button[children='-']").length
    ).toEqual(0);

    // Click the filter row's AND button.
    wrapper
      .find(".filter-row-buttons button[children='AND']")
      .simulate("click");

    // There should be 2 FilterRows, but the surrounding FilterGroup should still have no remove button.
    expect(wrapper.find(FilterRow).length).toEqual(2);
    expect(
      wrapper.find(".filter-group-buttons button[children='-']").length
    ).toEqual(0);

    // Click the FilterGroup's OR button.
    wrapper
      .find(".filter-group-buttons button[children='OR']")
      .simulate("click");

    // The filter should be "( ( predicate AND predicate ) OR predicate )".
    expect(wrapper.state().model).toEqual(
      objectContaining({
        children: [
          objectContaining({
            children: [
              objectContaining({ type: "FILTER_ROW" }),
              objectContaining({ type: "FILTER_ROW" })
            ],
            operator: "AND",
            type: "FILTER_GROUP"
          }),
          objectContaining({ type: "FILTER_ROW" })
        ],
        operator: "OR",
        type: "FILTER_GROUP"
      })
    );
  });

  it("Removes a filter group when the '-' button is clicked.", () => {
    const wrapper = mountFilterBuilder();

    // Click the filter row's AND button.
    wrapper
      .find(".filter-row-buttons button[children='AND']")
      .simulate("click");

    // Click the FilterGroup's OR button.
    wrapper
      .find(".filter-group-buttons button[children='OR']")
      .simulate("click");

    // Remove the inner AND group.
    wrapper
      .find(".filter-group-buttons button[children='-']")
      .simulate("click");

    // The filter model should be one filter group with one inner filter row.
    expect(wrapper.state().model).toEqual(
      objectContaining({
        children: [objectContaining({ type: "FILTER_ROW" })],
        type: "FILTER_GROUP"
      })
    );
  });

  it("Provides an 'onChange' callback prop that provides the filter model.", async () => {
    const onChange = jest.fn();

    const wrapper = mountFilterBuilder({ onChange });

    // Change a text input
    wrapper
      .find("input.filter-value")
      .first()
      .simulate("change", { target: { value: "first filter value" } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).lastCalledWith(wrapper.state().model);

    // Click the AND button
    wrapper
      .find(".filter-row-buttons button[children='AND']")
      .simulate("click");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).lastCalledWith(wrapper.state().model);

    // Click the OR button
    wrapper
      .find(".filter-group-buttons button[children='OR']")
      .simulate("click");
    await Promise.resolve();
    wrapper.update();
    expect(onChange).toHaveBeenCalledTimes(4);
    expect(onChange).lastCalledWith(wrapper.state().model);

    // Click the - button
    wrapper
      .find(".filter-group-buttons button[children='-']")
      .simulate("click");
    expect(onChange).toHaveBeenCalledTimes(5);
    expect(onChange).lastCalledWith(wrapper.state().model);
  });

  it("Resets to the initial state when a null value is passed.", async () => {
    function TestComponent() {
      const [model, setModel] = useState(null);
      return (
        <FilterBuilder
          filterAttributes={filterAttributes}
          onChange={setModel}
          value={model}
        />
      );
    }

    const wrapper = mount(<TestComponent />);

    expect(wrapper.find(FilterBuilder).prop("value")).toEqual(null);

    // Wait for state update
    await new Promise(setImmediate);
    wrapper.update();

    // Initially renders with the initial filter model.
    expect(wrapper.find(FilterBuilder).prop("value")).toEqual(
      expect.objectContaining({ type: "FILTER_GROUP" })
    );

    // Set the model to null.
    act(() => {
      wrapper.find(FilterBuilder).prop<any>("onChange")(null);
    });

    // Wait for state update.
    await new Promise(setImmediate);
    wrapper.update();

    // Resets itself with the inital filter model.
    expect(wrapper.find(FilterBuilder).prop("value")).toEqual(
      expect.objectContaining({ type: "FILTER_GROUP" })
    );
  });
});
