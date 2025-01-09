import { IntlProvider } from "react-intl";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { FilterAttribute } from "../FilterBuilder";
import { FilterBuilderContextProvider } from "../FilterBuilderContext";
import { FilterRow, FilterRowProps } from "../FilterRow";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

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
  const mockModelChange = jest.fn();

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
            key="0"
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
            onModelChange={mockModelChange}
            {...propsOverride}
          />
        </FilterBuilderContextProvider>
      </IntlProvider>
    );
  }

  it("Displays the given filter attributes in a dropdown menu.", () => {
    const wrapper = mountFilterRow();

    fireEvent.focus(
      wrapper.getByRole("combobox", { name: /filter attribute/i })
    );
    fireEvent.keyDown(
      wrapper.getByRole("combobox", { name: /filter attribute/i }),
      { key: "ArrowDown", code: "ArrowDown", charCode: 40 }
    );

    const options = wrapper.getAllByRole("option") as HTMLOptionElement[];
    expect(options.length).toBe(4);
    expect(options[0].textContent).toEqual("Name");
    expect(options[1].textContent).toEqual("Description");
    expect(options[2].textContent).toEqual("Specimen Number");
    expect(options[3].textContent).toEqual("Specimen Replicate Version");
  });

  it("Displays the predicates in a dropdown menu.", () => {
    const wrapper = mountFilterRow();

    fireEvent.focus(
      wrapper.getByRole("combobox", { name: /filter predicate/i })
    );
    fireEvent.keyDown(
      wrapper.getByRole("combobox", { name: /filter predicate/i }),
      { key: "ArrowDown", code: "ArrowDown", charCode: 40 }
    );

    const options = wrapper.getAllByRole("option") as HTMLOptionElement[];
    expect(options.length).toBe(2);
  });

  it("Changes the model's filter attribute when a new filter attribute is selected.", async () => {
    const wrapper = mountFilterRow();

    const select = wrapper.getByRole("combobox", { name: /filter attribute/i });
    fireEvent.change(select, { target: { value: "Desc" } });
    fireEvent.click(wrapper.getByRole("option", { name: /description/i }));
    await new Promise(setImmediate);

    expect(mockModelChange).lastCalledWith({
      attribute: "description",
      id: 1,
      predicate: "IS",
      searchType: "PARTIAL_MATCH",
      type: "FILTER_ROW",
      value: ""
    });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it("Changes the model's predicate when a new predicate is selected.", async () => {
    const wrapper = mountFilterRow();

    const select = wrapper.getByRole("combobox", { name: /filter predicate/i });
    fireEvent.change(select, { target: { value: "i" } });
    fireEvent.click(wrapper.getAllByRole("option", { name: "" })[1]);
    await new Promise(setImmediate);

    expect(mockModelChange).lastCalledWith({
      attribute: "name",
      id: 1,
      predicate: "IS NOT",
      searchType: "PARTIAL_MATCH",
      type: "FILTER_ROW",
      value: ""
    });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it("Changes the model's filter value when the filter value is changed.", () => {
    const wrapper = mountFilterRow();
    fireEvent.change(wrapper.getByRole("textbox", { name: /filter value/i }), {
      target: { value: "101F" }
    });

    expect(mockModelChange).lastCalledWith({
      attribute: "name",
      id: 1,
      predicate: "IS",
      searchType: "PARTIAL_MATCH",
      type: "FILTER_ROW",
      value: "101F"
    });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it("Provides a prop to show the remove button.", () => {
    const wrapper = mountFilterRow({ showRemoveButton: true });
    expect(wrapper.queryByRole("button", { name: /\-/i })).toBeInTheDocument();
  });

  it("Provides a prop to hide the remove button.", () => {
    const wrapper = mountFilterRow({ showRemoveButton: false });
    expect(
      wrapper.queryByRole("button", { name: /\-/i })
    ).not.toBeInTheDocument();
  });

  it("Makes the text input invisible when the search type is 'Blank field'", () => {
    const wrapper = mountFilterRow({
      model: {
        attribute: "name",
        id: 1,
        predicate: "IS",
        searchType: "BLANK_FIELD",
        type: "FILTER_ROW",
        value: ""
      }
    });

    expect(wrapper.queryByRole("textbox")).not.toBeInTheDocument();
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

    expect(wrapper.getByText(/specimen number/i)).toBeInTheDocument();
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
      wrapper.getByText(/specimen replicate version/i)
    ).toBeInTheDocument();
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
    expect(wrapper.getByText(/group name/i)).toBeInTheDocument();
  });
});
