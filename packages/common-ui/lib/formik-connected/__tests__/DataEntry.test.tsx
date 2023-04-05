import { DinaForm } from "../DinaForm";
import { KitsuResource } from "kitsu";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DataEntryField } from "../data-entry/DataEntryField";
import { DataBlock } from "../data-entry/DataBlock";
import { SelectField, TextField } from "../../../../common-ui/lib";
import { FaPlus, FaMinus } from "react-icons/fa";
import Select from "react-select";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";

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
    { name: "BLOCK_OPTION_2", key: "UNIT_OPTION_1" },
    { name: "BLOCK_OPTION_2", key: "UNIT_OPTION_2" },
    { name: "BLOCK_OPTION_2", key: "UNIT_OPTION_3" }
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
    case "collection-api/vocabulary/protocolData":
      return { data: blockOptions };
    case "collection-api/protocol-element":
      return { data: typeOptions };
    case "collection-api/vocabulary/unitsOfMeasurement":
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
          blockOptionsEndpoint={"collection-api/vocabulary/protocolData"}
          typeOptionsEndpoint={"collection-api/protocol-element"}
          unitOptionsEndpoint={"collection-api/vocabulary/unitsOfMeasurement"}
          name={name}
        />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();
    expect(wrapper.find(DataBlock).exists()).toEqual(false);

    wrapper.find("button.add-datablock").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(DataBlock).exists()).toEqual(true);

    // find DataBlock with specified name, then find SelectField inside DataBlock with specified name
    let dataBlock = wrapper
      .findWhere(
        (datablock) =>
          datablock.props().name ===
          `${name}.${blockOptions.vocabularyElements[0].name}`
      )
      .find(SelectField);

    // block select option
    dataBlock
      .filterWhere(
        (n: any) =>
          n.props().name ===
          `${name}.${blockOptions.vocabularyElements[0].name}.select`
      )
      .find<any>(Select)
      .props()
      .onChange({ label: "Block Option 1", value: "BLOCK_OPTION_1" });

    // type select option
    dataBlock
      .filterWhere(
        (n: any) =>
          n.props().name ===
          `${name}.${blockOptions.vocabularyElements[0].name}.rows.extensionField-0.type`
      )
      .find<any>(Select)
      .props()
      .onChange({ label: "Type Option 1", value: "TYPE_OPTION_1" });

    // unit select option
    dataBlock
      .filterWhere(
        (n: any) =>
          n.props().name ===
          `${name}.${blockOptions.vocabularyElements[0].name}.rows.extensionField-0.unit`
      )
      .find<any>(Select)
      .props()
      .onChange({ label: "Unit Option 1", value: "UNIT_OPTION_1" });

    wrapper
      .find<any>(TextField)
      .filterWhere(
        (n: any) =>
          n.props().name ===
          `${name}.${blockOptions.vocabularyElements[0].name}.rows.extensionField-0.value`
      )
      .find("input")
      .simulate("change", {
        target: {
          name: `${name}.${blockOptions.vocabularyElements[0].name}.rows.extensionField-0.value`,
          value: "VALUE_1"
        }
      });

    // form submission
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    // Formik should have the updated value.
    expect(mockSubmit).lastCalledWith({
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

    // Add new row to data block
    wrapper
      .findWhere(
        (datablock) =>
          datablock.props().name ===
          `${name}.${blockOptions.vocabularyElements[0].name}`
      )
      .find(FaPlus)
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // find DataBlock with specified name, then find SelectField inside DataBlock with specified name
    dataBlock = wrapper
      .findWhere(
        (datablock) =>
          datablock.props().name ===
          `${name}.${blockOptions.vocabularyElements[0].name}`
      )
      .find(SelectField);

    // type select option
    dataBlock
      .filterWhere(
        (n: any) =>
          n.props().name ===
          `${name}.${blockOptions.vocabularyElements[0].name}.rows.extensionField-1.type`
      )
      .find<any>(Select)
      .props()
      .onChange({ label: "Type Option 2", value: "TYPE_OPTION_2" });

    // unit select option
    dataBlock
      .filterWhere(
        (n: any) =>
          n.props().name ===
          `${name}.${blockOptions.vocabularyElements[0].name}.rows.extensionField-1.unit`
      )
      .find<any>(Select)
      .props()
      .onChange({ label: "Unit Option 2", value: "UNIT_OPTION_2" });

    wrapper
      .find<any>(TextField)
      .filterWhere(
        (n: any) =>
          n.props().name ===
          `${name}.${blockOptions.vocabularyElements[0].name}.rows.extensionField-1.value`
      )
      .find("input")
      .simulate("change", {
        target: {
          name: `${name}.${blockOptions.vocabularyElements[0].name}.rows.extensionField-1.value`,
          value: "VALUE_2"
        }
      });

    // form submission
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    // Formik should have the updated value.
    expect(mockSubmit).lastCalledWith({
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

    wrapper.find("button.add-datablock").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // find DataBlock with specified name, then find SelectField inside DataBlock with specified name
    const selectFieldsSecondBlock = wrapper
      .findWhere(
        (datablock) =>
          datablock.props().name ===
          `${name}.${blockOptions.vocabularyElements[1].name}`
      )
      .find(SelectField);
    // block select option
    selectFieldsSecondBlock
      .filterWhere(
        (n: any) =>
          n.props().name ===
          `${name}.${blockOptions.vocabularyElements[1].name}.select`
      )
      .find<any>(Select)
      .props()
      .onChange({ label: "Block Option 2", value: "BLOCK_OPTION_2" });

    // type select option
    selectFieldsSecondBlock
      .filterWhere(
        (n: any) =>
          n.props().name ===
          `${name}.${blockOptions.vocabularyElements[1].name}.rows.extensionField-0.type`
      )
      .find<any>(Select)
      .props()
      .onChange({ label: "Type Option 3", value: "TYPE_OPTION_3" });

    // unit select option
    selectFieldsSecondBlock
      .filterWhere(
        (n: any) =>
          n.props().name ===
          `${name}.${blockOptions.vocabularyElements[1].name}.rows.extensionField-0.unit`
      )
      .find<any>(Select)
      .props()
      .onChange({ label: "Unit Option 3", value: "UNIT_OPTION_3" });

    wrapper
      .find<any>(TextField)
      .filterWhere(
        (n: any) =>
          n.props().name ===
          `${name}.${blockOptions.vocabularyElements[1].name}.rows.extensionField-0.value`
      )
      .find("input")
      .simulate("change", {
        target: {
          name: `${name}.${blockOptions.vocabularyElements[1].name}.rows.extensionField-0.value`,
          value: "VALUE_3"
        }
      });

    // form submission
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    // Formik should have the updated value.
    expect(mockSubmit).lastCalledWith({
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
