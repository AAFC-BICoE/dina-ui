import { IntlProvider } from "react-intl";
import Select from "react-select/base";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { FilterAttribute } from "../FilterBuilder";
import { FilterBuilderContextProvider } from "../FilterBuilderContext";
import { FilterRow, FilterRowProps } from "../FilterRow";

const TEST_SPECIMEN_NUMBER_FILTER: FilterAttribute = {
  allowRange: true,
  label: "Specimen Number",
  name: "specimenReplicate.specimen.number"
};

const TEST_REPLICATE_VERSION_FILTER: FilterAttribute = {
  name: "specimenReplicate.version"
};

const TEST_FILTER_ATTRIBUTES: FilterAttribute[] = [
  "name",
  "description",
  TEST_SPECIMEN_NUMBER_FILTER,
  TEST_REPLICATE_VERSION_FILTER
];

describe("FilterRow component", () => {
  const mockOnChange = jest.fn();
  const mockOnAndClick = jest.fn();
  const mockOnDeleteClick = jest.fn();
  const mockOnOrClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mountFilterRow(
    propsOverride: Partial<FilterRowProps> = {},
    filterAttributes?: FilterAttribute[]
  ) {
    return mountWithAppContext(
      <IntlProvider
        locale="en"
        messages={{ "field_group.groupName": "Group Name" }}
      >
        <FilterBuilderContextProvider
          filterAttributes={filterAttributes || TEST_FILTER_ATTRIBUTES}
        >
          <FilterRow
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
            {...propsOverride}
          />
        </FilterBuilderContextProvider>
      </IntlProvider>
    );
  }

  it("Displays the given filter attributes in a dropdown menu.", () => {
    const wrapper = mountFilterRow();

    expect(
      wrapper.find(".filter-attribute").find(Select).props().options
    ).toEqual([
      { label: "Name", value: "name" },
      { label: "Description", value: "description" },
      {
        label: "Specimen Number",
        value: {
          allowRange: true,
          label: "Specimen Number",
          name: "specimenReplicate.specimen.number"
        }
      },
      {
        label: "Specimen Replicate Version",
        value: {
          name: "specimenReplicate.version"
        }
      }
    ]);
  });

  it("Displays the predicates in a dropdown menu.", () => {
    const wrapper = mountFilterRow();

    expect(
      wrapper.find(".filter-predicate").find(Select).props().options
    ).toEqual([
      { label: expect.anything(), value: "IS" },
      { label: expect.anything(), value: "IS NOT" }
    ]);
  });

  it("Changes the model's filter attribute when a new filter attribute is selected.", () => {
    const wrapper = mountFilterRow();
    const model = wrapper.find(FilterRow).props().model;

    wrapper
      .find(".filter-attribute")
      .find(Select)
      .props()
      .onChange({ value: "description" }, null);

    expect(model.attribute).toEqual("description");
  });

  it("Changes the model's predicate when a new predicate is selected.", () => {
    const wrapper = mountFilterRow();
    const model = wrapper.find(FilterRow).props().model;

    wrapper
      .find(".filter-predicate")
      .find(Select)
      .props()
      .onChange({ value: "IS NOT" }, null);

    expect(model.predicate).toEqual("IS NOT");
  });

  it("Changes the model's filter value when the filter value is changed.", () => {
    const wrapper = mountFilterRow();
    const model = wrapper.find(FilterRow).props().model;

    wrapper
      .find("input.filter-value")
      .simulate("change", { target: { value: "101F" } });

    expect(model.value).toEqual("101F");
  });

  it("Changes the model's searchType value when the search type is changed.", () => {
    const wrapper = mountFilterRow();
    const model = wrapper.find(FilterRow).props().model;

    expect(model.searchType).toEqual("PARTIAL_MATCH");

    wrapper
      .find(".filter-search-type")
      .find(Select)
      .props()
      .onChange({ value: "EXACT_MATCH" }, null);

    expect(model.searchType).toEqual("EXACT_MATCH");
  });

  it("Provides a prop to show or hide the remove button.", async () => {
    const withRemoveButton = mountFilterRow({ showRemoveButton: true });
    expect(withRemoveButton.find("button.remove").exists()).toEqual(true);

    const withoutRemoveButton = mountFilterRow({ showRemoveButton: false });
    expect(withoutRemoveButton.find("button.remove").exists()).toEqual(false);
  });

  it("Provides an 'onChange' prop to notify of change events.", () => {
    const wrapper = mountFilterRow();

    // Change the filtered field.
    wrapper
      .find(".filter-attribute")
      .find(Select)
      .props()
      .onChange({ value: "description" }, null);
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    // Change the filter predicate (IS / IS NOT).
    wrapper
      .find(".filter-predicate")
      .find(Select)
      .props()
      .onChange({ value: "IS NOT" }, null);
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
      .onChange({ value: "EXACT_MATCH" }, null);
    expect(mockOnChange).toHaveBeenCalledTimes(4);
  });

  it("Makes the text input invisible when the search type is 'Blank field'", () => {
    const wrapper = mountFilterRow();

    // The input is visible be default
    expect(
      wrapper.find("input.filter-value").prop("style")?.visibility
    ).toEqual(undefined);

    // Change the search type to "BLANK_FIELD".
    wrapper
      .find(".filter-search-type")
      .find(Select)
      .props()
      .onChange({ value: "BLANK_FIELD" }, null);
    wrapper.update();

    // The input should now be hidden.
    expect(
      wrapper.find("input.filter-value").prop("style")?.visibility
    ).toEqual("hidden");
  });

  it("Can show a custom filter attribute label.", () => {
    const wrapper = mountFilterRow({
      model: {
        attribute: TEST_SPECIMEN_NUMBER_FILTER,
        id: 1,
        predicate: "IS",
        searchType: "PARTIAL_MATCH",
        type: "FILTER_ROW",
        value: ""
      }
    });

    expect(
      wrapper.find(".filter-attribute").find(Select).prop("value")
    ).toEqual({
      label: "Specimen Number",
      value: TEST_SPECIMEN_NUMBER_FILTER
    });
  });

  it("Generated a title case label for a filter attribute object.", () => {
    const wrapper = mountFilterRow({
      model: {
        attribute: TEST_REPLICATE_VERSION_FILTER,
        id: 1,
        predicate: "IS",
        searchType: "PARTIAL_MATCH",
        type: "FILTER_ROW",
        value: ""
      }
    });

    expect(
      wrapper.find(".filter-attribute").find(Select).prop("value")
    ).toEqual({
      label: "Specimen Replicate Version",
      value: TEST_REPLICATE_VERSION_FILTER
    });
  });

  it("Displays the intl message for a field name if there is one.", () => {
    const TEST_INTL_FIELD_NAME = "group.groupName";
    const wrapper = mountFilterRow(
      {
        model: {
          attribute: TEST_INTL_FIELD_NAME,
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: ""
        }
      },
      [TEST_INTL_FIELD_NAME]
    );

    // The field label should be "Group Name" instead of teh auto-generated "Group Group Name":
    expect(
      wrapper.find(".filter-attribute").find(Select).prop("value")
    ).toEqual({
      label: "Group Name",
      value: TEST_INTL_FIELD_NAME
    });
  });
});
