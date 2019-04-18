import { mount } from "enzyme";
import Select from "react-select/lib/Select";
import { FilterRow } from "../FilterRow";

describe("FilterRow component", () => {
  const mockOnChange = jest.fn();
  const mockOnAndClick = jest.fn();
  const mockOnDeleteClick = jest.fn();
  const mockOnOrClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mountFilterRow() {
    return mount<FilterRow>(
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
        .find(".filter-attribute")
        .find(Select)
        .props().options
    ).toEqual([
      { label: "Name", value: "name" },
      { label: "Description", value: "description" }
    ]);
  });

  it("Displays the predicates in a dropdown menu.", () => {
    const wrapper = mountFilterRow();

    expect(
      wrapper
        .find(".filter-predicate")
        .find(Select)
        .props().options
    ).toEqual([
      { label: "IS", value: "IS" },
      { label: "IS NOT", value: "IS NOT" }
    ]);
  });

  it("Changes the model's filter attribute when a new filter attribute is selected.", () => {
    const wrapper = mountFilterRow();
    const model = wrapper.props().model;

    wrapper
      .find(".filter-attribute")
      .find(Select)
      .props()
      .onChange({ value: "description" });

    expect(model.attribute).toEqual("description");
  });

  it("Changes the model's predicate when a new predicate is selected.", () => {
    const wrapper = mountFilterRow();
    const model = wrapper.props().model;

    wrapper
      .find(".filter-predicate")
      .find(Select)
      .props()
      .onChange({ value: "IS NOT" });

    expect(model.predicate).toEqual("IS NOT");
  });

  it("Changes the model's filter value when the filter value is changed.", () => {
    const wrapper = mountFilterRow();
    const model = wrapper.props().model;

    wrapper
      .find("input.filter-value")
      .simulate("change", { target: { value: "101F" } });

    expect(model.value).toEqual("101F");
  });

  it("Changes the model's searchType value when the search type is changed.", () => {
    const wrapper = mountFilterRow();
    const model = wrapper.props().model;

    expect(model.searchType).toEqual("PARTIAL_MATCH");

    wrapper
      .find(".filter-search-type")
      .find(Select)
      .props()
      .onChange({ value: "EXACT_MATCH" });

    expect(model.searchType).toEqual("EXACT_MATCH");
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
      .find(".filter-attribute")
      .find(Select)
      .props()
      .onChange({ value: "description" });
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    // Change the filter predicate (IS / IS NOT).
    wrapper
      .find(".filter-predicate")
      .find(Select)
      .props()
      .onChange({ value: "IS NOT" });
    expect(mockOnChange).toHaveBeenCalledTimes(2);

    // Change the filter value.
    wrapper
      .find("input.filter-value")
      .simulate("change", { target: { value: "101F" } });
    expect(mockOnChange).toHaveBeenCalledTimes(3);

    wrapper
      .find(".filter-search-type")
      .find(Select)
      .props()
      .onChange({ value: "EXACT_MATCH" });
    expect(mockOnChange).toHaveBeenCalledTimes(4);
  });

  it("Makes the text input invisible when the search type is 'Blank field'", () => {
    const wrapper = mountFilterRow();

    // The input is visible be default
    expect(wrapper.find("input.filter-value").prop("style")).toEqual({
      visibility: undefined
    });

    // Change the search type to "BLANK_FIELD".
    wrapper
      .find(".filter-search-type")
      .find(Select)
      .props()
      .onChange({ value: "BLANK_FIELD" });
    wrapper.update();

    // The input should now be hidden.
    expect(wrapper.find("input.filter-value").prop("style")).toEqual({
      visibility: "hidden"
    });
  });
});
