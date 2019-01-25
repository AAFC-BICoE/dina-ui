import { mount } from "enzyme";
import Select from "react-select/lib/Select";
import { FilterRow, FilterRowModel } from "../FilterRow";

describe("FilterRow component", () => {
  const mockOnAndClick = jest.fn();
  const mockOnDeleteClick = jest.fn();
  const mockOnOrClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mountFilterRow() {
    return mount(
      <FilterRow
        filterAttributes={["name", "description"]}
        model={{
          attribute: "name",
          id: 1,
          predicate: "IS",
          type: "FILTER_ROW",
          value: ""
        }}
        onAndClick={mockOnAndClick}
        onRemoveClick={mockOnDeleteClick}
        onOrClick={mockOnOrClick}
      />
    );
  }

  it("Displays the given filter attributes in a dropdown menu.", () => {
    const wrapper = mountFilterRow();

    expect(
      wrapper
        .find(Select)
        .first()
        .props().options
    ).toEqual([
      { label: "name", value: "name" },
      { label: "description", value: "description" }
    ]);
  });

  it("Displays the predicates in a dropdown menu.", () => {
    const wrapper = mountFilterRow();

    expect(
      wrapper
        .find(Select)
        .at(1)
        .props().options
    ).toEqual([
      { label: "IS", value: "IS" },
      { label: "IS NOT", value: "IS NOT" }
    ]);
  });

  it("Changes the model's filter attribute when a new filter attribute is selected.", () => {
    const wrapper = mountFilterRow();
    const model: FilterRowModel = wrapper.props().model;

    wrapper
      .find(Select)
      .first()
      .props()
      .onChange({ value: "description" });

    expect(model.attribute).toEqual("description");
  });

  it("Changes the model's predicate when a new predicate is selected.", () => {
    const wrapper = mountFilterRow();
    const model: FilterRowModel = wrapper.props().model;

    wrapper
      .find(Select)
      // Get the second Select.
      .at(1)
      .props()
      .onChange({ value: "IS NOT" });

    expect(model.predicate).toEqual("IS NOT");
  });

  it("Changes the model's filter value when the filter value is changed.", () => {
    const wrapper = mountFilterRow();
    const model: FilterRowModel = wrapper.props().model;

    wrapper
      .find("input.filter-value")
      .simulate("change", { target: { value: "101F" } });

    expect(model.value).toEqual("101F");
  });
});
