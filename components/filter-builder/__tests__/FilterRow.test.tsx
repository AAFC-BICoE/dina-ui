import { mount } from "enzyme";
import Select from "react-select/lib/Select";
import { FilterRow, FilterRowModel } from "../FilterRow";

describe("FilterRow component", () => {
  const mockOnChange = jest.fn();
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
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: ""
        }}
        onChange={mockOnChange}
        onAndClick={mockOnAndClick}
        onRemoveClick={mockOnDeleteClick}
        onOrClick={mockOnOrClick}
        showRemoveButton={true}
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

  it("Provides a prop to show or hide the remove button.", async () => {
    const withRemoveButton = mountFilterRow();
    withRemoveButton.setProps({ showRemoveButton: true });
    expect(withRemoveButton.find("button[children='-']").exists()).toEqual(
      true
    );

    const withoutRemoveButton = mountFilterRow();
    withoutRemoveButton.setProps({ showRemoveButton: false });
    expect(withoutRemoveButton.find("button[children='-']").exists()).toEqual(
      false
    );
  });

  it("Provides an 'onChange' prop to notify of change events.", () => {
    const wrapper = mountFilterRow();

    // Change the filtered field.
    wrapper
      .find(Select)
      .first()
      .props()
      .onChange({ value: "description" });
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    // Change the filter predicate (IS / IS NOT).
    wrapper
      .find(Select)
      .at(1)
      .props()
      .onChange({ value: "IS NOT" });
    expect(mockOnChange).toHaveBeenCalledTimes(2);

    // Change the filter value.
    wrapper
      .find("input.filter-value")
      .simulate("change", { target: { value: "101F" } });
    expect(mockOnChange).toHaveBeenCalledTimes(3);
  });
});
