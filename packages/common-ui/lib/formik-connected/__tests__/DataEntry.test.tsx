import { DinaForm } from "../DinaForm";
import { mountWithAppContext } from "common-ui";
import { DataEntryField } from "../data-entry/DataEntryField";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { fireEvent, waitForElementToBeRemoved } from "@testing-library/react";
import "@testing-library/jest-dom";

const blockOptions = {
  id: "blockOptions",
  type: "vocabulary",
  vocabularyElements: [
    { name: "BLOCK_OPTION_1", key: "BLOCK_OPTION_1" },
    { name: "BLOCK_OPTION_2", key: "BLOCK_OPTION_2" },
    { name: "BLOCK_OPTION_2", key: "BLOCK_OPTION_3" }
  ]
};

const unitsOptions = {
  id: "unitsOptions",
  type: "vocabulary",
  vocabularyElements: [
    { name: "UNIT OPTION 1", key: "UNIT_OPTION_1" },
    { name: "UNIT OPTION 2", key: "UNIT_OPTION_2" },
    { name: "UNIT OPTION 3", key: "UNIT_OPTION_3" }
  ]
};
const typeOptions = [
  {
    id: "TYPE_OPTION_1",
    type: "protocol-element",
    multilingualTitle: {
      titles: [{ lang: "en", title: "TYPE_OPTION_1" }]
    }
  },
  {
    id: "TYPE_OPTION_2",
    type: "protocol-element",
    multilingualTitle: {
      titles: [{ lang: "en", title: "TYPE_OPTION_2" }]
    }
  },
  {
    id: "TYPE_OPTION_3",
    type: "protocol-element",
    multilingualTitle: {
      titles: [{ lang: "en", title: "TYPE_OPTION_3" }]
    }
  }
];

const mockGet = jest.fn(async (path) => {
  switch (path) {
    case "collection-api/vocabulary2/protocolData":
      return { data: blockOptions };
    case "collection-api/protocol-element":
      return { data: typeOptions };
    case "collection-api/vocabulary2/unitsOfMeasurement":
      return { data: unitsOptions };
  }
});

const apiContext = {
  apiClient: {
    get: mockGet
  }
} as any;

// Mock out the debounce function to avoid waiting during tests.
jest.mock("use-debounce", () => ({
  useDebounce: (fn) => [fn, { isPending: () => false }]
}));

const mockSubmit = jest.fn();

describe("DataEntry", () => {
  // Clear the mocks between tests.
  beforeEach(jest.clearAllMocks);

  it("Tests correct number of data blocks and data block fields entered", async () => {
    const name = "extensionValues";
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={async ({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <DataEntryField
          legend={<DinaMessage id="fieldExtensions" />}
          isVocabularyBasedEnabledForBlock={true}
          isVocabularyBasedEnabledForType={true}
          blockOptionsEndpoint={"collection-api/vocabulary2/protocolData"}
          typeOptionsEndpoint={"collection-api/protocol-element"}
          unitOptionsEndpoint={"collection-api/vocabulary2/unitsOfMeasurement"}
          name={name}
        />
      </DinaForm>,
      { apiContext }
    );

    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Click the "+" icon to add a new field.
    const addSection = wrapper.getByRole("button");
    fireEvent.click(addSection);

    // Expect block option 1 to be created:
    expect(wrapper.getByText(/block_option_1/i)).toBeInTheDocument();

    const typeSelect = wrapper.getAllByRole("combobox", {
      name: /select\.\.\./i
    })[0];
    fireEvent.change(typeSelect, { target: { value: "TYPE_OPTION_1" } });
    fireEvent.click(wrapper.getByRole("option", { name: /type_option_1/i }));

    // Expect type option 1 to be selected.
    expect(wrapper.getByText(/type_option_1/i)).toBeInTheDocument();

    // unit select option
    const unitSelect = wrapper.getByRole("combobox", { name: /select\.\.\./i });
    fireEvent.change(unitSelect, { target: { value: "UNIT_OPTION_1" } });
    fireEvent.click(wrapper.getByRole("option", { name: /unit option 1/i }));

    // Expect unit option 1 to be selected.
    expect(wrapper.getByText(/unit option 1/i)).toBeInTheDocument();

    // Change the value
    fireEvent.change(wrapper.getByRole("textbox"), {
      target: { value: "VALUE_1" }
    });

    // Submit the form.
    fireEvent.submit(wrapper.getByRole("group"));
    await wrapper.waitForRequests();

    // Formik should have the updated value.
    expect(mockSubmit).toHaveBeenLastCalledWith({
      [name]: {
        BLOCK_OPTION_1: {
          rows: {
            "extensionField-0": {
              type: "TYPE_OPTION_1",
              unit: "UNIT_OPTION_1",
              value: "VALUE_1"
            }
          },
          select: "BLOCK_OPTION_1"
        }
      }
    });

    // Add another row:
    fireEvent.click(wrapper.getByTestId("add row button"));

    // Change the type for this new row.
    const typeSelect2 = wrapper.getAllByRole("combobox", {
      name: /select\.\.\./i
    })[0];
    fireEvent.change(typeSelect2, { target: { value: "TYPE_OPTION_2" } });
    fireEvent.click(wrapper.getByRole("option", { name: /type_option_2/i }));

    // Expect type option 1 to be selected.
    expect(wrapper.getByText(/type_option_2/i)).toBeInTheDocument();

    // unit select option
    const unitSelect2 = wrapper.getByRole("combobox", {
      name: /select\.\.\./i
    });
    fireEvent.change(unitSelect2, { target: { value: "UNIT_OPTION_2" } });
    fireEvent.click(wrapper.getByRole("option", { name: /unit option 2/i }));

    // Expect unit option 1 to be selected.
    expect(wrapper.getByText(/unit option 2/i)).toBeInTheDocument();

    // Change the value
    fireEvent.change(wrapper.getAllByRole("textbox")[1], {
      target: { value: "VALUE_2" }
    });

    // Submit the form.
    fireEvent.submit(wrapper.getByRole("group"));
    await wrapper.waitForRequests();

    // Formik should have the updated value.
    expect(mockSubmit).toHaveBeenLastCalledWith({
      [name]: {
        BLOCK_OPTION_1: {
          rows: {
            "extensionField-0": {
              type: "TYPE_OPTION_1",
              unit: "UNIT_OPTION_1",
              value: "VALUE_1"
            },

            "extensionField-1": {
              type: "TYPE_OPTION_2",
              unit: "UNIT_OPTION_2",
              value: "VALUE_2"
            }
          },
          select: "BLOCK_OPTION_1"
        }
      }
    });

    fireEvent.click(addSection);
    expect(wrapper.getByText(/block_option_2/i)).toBeInTheDocument();

    // type select option
    const typeSelect3 = wrapper.getAllByRole("combobox", {
      name: /select\.\.\./i
    })[0];
    fireEvent.change(typeSelect3, { target: { value: "TYPE_OPTION_3" } });
    fireEvent.click(wrapper.getByRole("option", { name: /type_option_3/i }));

    // Expect type option 1 to be selected.
    expect(wrapper.getByText(/type_option_3/i)).toBeInTheDocument();

    // unit select option
    const unitSelect3 = wrapper.getByRole("combobox", {
      name: /select\.\.\./i
    });
    fireEvent.change(unitSelect3, { target: { value: "UNIT_OPTION_3" } });
    fireEvent.click(wrapper.getByRole("option", { name: /unit option 3/i }));

    // Expect unit option 1 to be selected.
    expect(wrapper.getByText(/unit option 3/i)).toBeInTheDocument();

    // Change the value
    fireEvent.change(wrapper.getAllByRole("textbox")[2], {
      target: { value: "VALUE_3" }
    });

    // form submission
    fireEvent.submit(wrapper.getByRole("group"));
    await wrapper.waitForRequests();

    // Formik should have the updated value.
    expect(mockSubmit).toHaveBeenLastCalledWith({
      [name]: {
        BLOCK_OPTION_1: {
          rows: {
            "extensionField-0": {
              type: "TYPE_OPTION_1",
              unit: "UNIT_OPTION_1",
              value: "VALUE_1"
            },

            "extensionField-1": {
              type: "TYPE_OPTION_2",
              unit: "UNIT_OPTION_2",
              value: "VALUE_2"
            }
          },
          select: "BLOCK_OPTION_1"
        },
        BLOCK_OPTION_2: {
          rows: {
            "extensionField-0": {
              type: "TYPE_OPTION_3",
              unit: "UNIT_OPTION_3",
              value: "VALUE_3"
            }
          },
          select: "BLOCK_OPTION_2"
        }
      }
    });
  });
});
