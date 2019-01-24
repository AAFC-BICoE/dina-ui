import { mount } from "enzyme";
import { FilterBuilder, FilterBuilderState } from "../FilterBuilder";
import { FilterGroup } from "../FilterGroup";
import { FilterRow } from "../FilterRow";

describe("FilterBuilder component", () => {
  const filterAttributes = ["name", "description"];

  function mountFilterBuilder() {
    return mount(<FilterBuilder filterAttributes={filterAttributes} />);
  }

  it("Renders initially with one FilterRow.", () => {
    const wrapper = mountFilterBuilder();

    expect((wrapper.state() as FilterBuilderState).model).toEqual({
      children: [
        { attribute: "name", predicate: "IS", type: "FILTER_ROW", value: "" }
      ],
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

    await Promise.resolve();

    expect((wrapper.state() as FilterBuilderState).model).toEqual({
      children: [
        { attribute: "name", predicate: "IS", type: "FILTER_ROW", value: "" },
        { attribute: "name", predicate: "IS", type: "FILTER_ROW", value: "" }
      ],
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

    await Promise.resolve();

    expect((wrapper.state() as FilterBuilderState).model).toEqual({
      children: [
        { attribute: "name", predicate: "IS", type: "FILTER_ROW", value: "" },
        { attribute: "name", predicate: "IS", type: "FILTER_ROW", value: "" }
      ],
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

    await Promise.resolve();

    wrapper
      .find(FilterRow)
      .at(1)
      .find("button[children='OR']")
      .simulate("click");

    await Promise.resolve();

    expect((wrapper.state() as FilterBuilderState).model).toEqual({
      children: [
        { attribute: "name", predicate: "IS", type: "FILTER_ROW", value: "" },
        {
          children: [
            {
              attribute: "name",
              predicate: "IS",
              type: "FILTER_ROW",
              value: ""
            },
            {
              attribute: "name",
              predicate: "IS",
              type: "FILTER_ROW",
              value: ""
            }
          ],
          operator: "OR",
          type: "FILTER_GROUP"
        }
      ],
      operator: "AND",
      type: "FILTER_GROUP"
    });

    expect(wrapper.find(FilterGroup).length).toEqual(2);
    expect(wrapper.find(FilterRow).length).toEqual(3);
  });
});
