import { mount } from "enzyme";
import { FilterBuilder, FilterBuilderState } from "../FilterBuilder";
import { FilterGroup } from "../FilterGroup";
import { FilterRow } from "../FilterRow";

describe("FilterBuilder component", () => {
  const { objectContaining } = expect;

  const filterAttributes = ["name", "description"];

  function mountFilterBuilder() {
    return mount(<FilterBuilder filterAttributes={filterAttributes} />);
  }

  it("Renders initially with one FilterRow.", () => {
    const wrapper = mountFilterBuilder();

    expect((wrapper.state() as FilterBuilderState).model).toEqual({
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
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

  it("Adds a FilterRow in an AND group when the FilterRow's AND button is clicked.", async () => {
    const wrapper = mountFilterBuilder();

    wrapper
      .find(FilterRow)
      .find("button[children='AND']")
      .simulate("click");

    expect((wrapper.state() as FilterBuilderState).model).toEqual({
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          type: "FILTER_ROW",
          value: ""
        },
        {
          attribute: "name",
          id: 3,
          predicate: "IS",
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

  it("Adds a FilterRow in an OR group when the FilterRow's OR button is clicked.", async () => {
    const wrapper = mountFilterBuilder();

    wrapper
      .find(FilterRow)
      .find("button[children='OR']")
      .simulate("click");

    expect((wrapper.state() as FilterBuilderState).model).toEqual({
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          type: "FILTER_ROW",
          value: ""
        },
        {
          attribute: "name",
          id: 3,
          predicate: "IS",
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

  it("Nests filter groups.", async () => {
    const wrapper = mountFilterBuilder();

    wrapper
      .find(FilterRow)
      .find("button[children='AND']")
      .simulate("click");

    wrapper
      .find(FilterRow)
      .at(1)
      .find("button[children='OR']")
      .simulate("click");

    expect((wrapper.state() as FilterBuilderState).model).toEqual({
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          type: "FILTER_ROW",
          value: ""
        },
        {
          children: [
            {
              attribute: "name",
              id: 3,
              predicate: "IS",
              type: "FILTER_ROW",
              value: ""
            },
            {
              attribute: "name",
              id: 4,
              predicate: "IS",
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

  it("Inserts a new filter row immediately after the clicked AND button's row.", async () => {
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
    expect((wrapper.state() as FilterBuilderState).model).toEqual(
      objectContaining({
        children: [
          objectContaining({ value: "first filter value" }),
          objectContaining({ value: "" }),
          objectContaining({ value: "second filter value" })
        ]
      })
    );
  });

  it("Removes a filter row when the '-' button is clicked.", async () => {
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

    expect((wrapper.state() as FilterBuilderState).model).toEqual(
      objectContaining({
        children: [objectContaining({ value: "second filter value" })]
      })
    );
  });

  it("Removes a filter group that only has one child after a filter row is removed.", () => {
    const wrapper = mountFilterBuilder();

    // Click the initial FilterRow's AND button
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
    expect((wrapper.state() as FilterBuilderState).model).toEqual(
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

  it("Hides the Remove button when there is only one filter row.", () => {
    const wrapper = mountFilterBuilder();
    expect(wrapper.find(FilterRow).length).toEqual(1);
    expect(wrapper.find("button[children='-']").exists()).toEqual(false);
  });
});
