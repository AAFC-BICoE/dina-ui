import { DinaForm } from "../DinaForm";
import { KitsuResource } from "kitsu";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DataEntry } from "../data-entry/DataEntry";
import { DataBlock } from "../data-entry/DataBlock";
import { SelectField, TextField } from "../../../../common-ui/lib";
import { FaPlus, FaMinus } from "react-icons/fa";
import Select from "react-select";

interface Person extends KitsuResource {
  name: string;
}

const PERSON_TEST_DATA_JSON_API = {
  data: [
    { name: "person1-json-api" },
    { name: "person2-json-api" },
    { name: "person3-json-api" }
  ]
};

// JSON API mock response.
const mockGet = jest.fn(async () => PERSON_TEST_DATA_JSON_API);

// JSON API
const mockGetAll = jest.fn(async (path) => {
  if (path === "agent-api/person") {
    return PERSON_TEST_DATA_JSON_API;
  }
});

const apiContext = {
  apiClient: {
    get: mockGet
  }
} as any;

const blockOptions = [
  { label: "Block Option 1", value: "BLOCK_OPTION_1" },
  { label: "Block Option 2", value: "BLOCK_OPTION_2" },
  { label: "Block Option 3", value: "BLOCK_OPTION_3" }
];
const unitsOptions = [
  { label: "Unit Option 1", value: "UNIT_OPTION_1" },
  { label: "Unit Option 2", value: "UNIT_OPTION_2" },
  { label: "Unit Option 3", value: "UNIT_OPTION_3" }
];
const typeOptions = [
  { label: "Type Option 1", value: "TYPE_OPTION_1" },
  { label: "Type Option 2", value: "TYPE_OPTION_2" },
  { label: "Type Option 3", value: "TYPE_OPTION_3" }
];
const mockSubmit = jest.fn();

describe("DataEntry", () => {
  // Clear the mocks between tests.
  beforeEach(jest.clearAllMocks);

  it("Tests correct number of data blocks and data block fields entered", async () => {
    const name = "blocks";
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={async ({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <DataEntry
          blockOptions={blockOptions}
          unitsOptions={unitsOptions}
          model={"agent-api/person"}
          typeOptions={typeOptions}
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
    let selectFields = wrapper
      .findWhere((datablock) => datablock.props().name === `${name}[0]`)
      .find(SelectField);

    // block select option
    selectFields
      .filterWhere((n: any) => n.props().name === `${name}[0].select`)
      .find<any>(Select)
      .props()
      .onChange({ label: "Block Option 1", value: "BLOCK_OPTION_1" });

    // type select option
    selectFields
      .filterWhere((n: any) => n.props().name === `${name}[0].rows[0].type`)
      .find<any>(Select)
      .props()
      .onChange({ label: "Type Option 1", value: "TYPE_OPTION_1" });

    // unit select option
    selectFields
      .filterWhere((n: any) => n.props().name === `${name}[0].rows[0].unit`)
      .find<any>(Select)
      .props()
      .onChange({ label: "Unit Option 1", value: "UNIT_OPTION_1" });

    wrapper
      .find<any>(TextField)
      .filterWhere((n: any) => n.props().name === `${name}[0].rows[0].value`)
      .find("input")
      .simulate("change", {
        target: { name: `${name}[0].rows[0].value`, value: "VALUE_1" }
      });

    // form submission
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    // Formik should have the updated value.
    expect(mockSubmit).lastCalledWith({
      blocks: [
        {
          rows: [
            {
              type: "TYPE_OPTION_1",
              unit: "UNIT_OPTION_1",
              value: "VALUE_1"
            }
          ],
          select: "BLOCK_OPTION_1"
        }
      ]
    });

    // Add new row to data block
    wrapper
      .findWhere((datablock) => datablock.props().name === `${name}[0]`)
      .find(FaPlus)
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // find DataBlock with specified name, then find SelectField inside DataBlock with specified name
    selectFields = wrapper
      .findWhere((datablock) => datablock.props().name === `${name}[0]`)
      .find(SelectField);

    // type select option
    selectFields
      .filterWhere((n: any) => n.props().name === `${name}[0].rows[1].type`)
      .find<any>(Select)
      .props()
      .onChange({ label: "Type Option 2", value: "TYPE_OPTION_2" });

    // unit select option
    selectFields
      .filterWhere((n: any) => n.props().name === `${name}[0].rows[1].unit`)
      .find<any>(Select)
      .props()
      .onChange({ label: "Unit Option 2", value: "UNIT_OPTION_2" });

    wrapper
      .find<any>(TextField)
      .filterWhere((n: any) => n.props().name === `${name}[0].rows[1].value`)
      .find("input")
      .simulate("change", {
        target: { name: `${name}[0].rows[1].value`, value: "VALUE_2" }
      });

    // form submission
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    // Formik should have the updated value.
    expect(mockSubmit).lastCalledWith({
      blocks: [
        {
          rows: [
            {
              type: "TYPE_OPTION_1",
              unit: "UNIT_OPTION_1",
              value: "VALUE_1"
            },
            {
              type: "TYPE_OPTION_2",
              unit: "UNIT_OPTION_2",
              value: "VALUE_2"
            }
          ],
          select: "BLOCK_OPTION_1"
        }
      ]
    });

    wrapper.find("button.add-datablock").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // find DataBlock with specified name, then find SelectField inside DataBlock with specified name
    const selectFieldsSecondBlock = wrapper
      .findWhere((datablock) => datablock.props().name === `${name}[1]`)
      .find(SelectField);

    // block select option
    selectFieldsSecondBlock
      .filterWhere((n: any) => n.props().name === `${name}[1].select`)
      .find<any>(Select)
      .props()
      .onChange({ label: "Block Option 2", value: "BLOCK_OPTION_2" });

    // type select option
    selectFieldsSecondBlock
      .filterWhere((n: any) => n.props().name === `${name}[1].rows[0].type`)
      .find<any>(Select)
      .props()
      .onChange({ label: "Type Option 3", value: "TYPE_OPTION_3" });

    // unit select option
    selectFieldsSecondBlock
      .filterWhere((n: any) => n.props().name === `${name}[1].rows[0].unit`)
      .find<any>(Select)
      .props()
      .onChange({ label: "Unit Option 3", value: "UNIT_OPTION_3" });

    wrapper
      .find<any>(TextField)
      .filterWhere((n: any) => n.props().name === `${name}[1].rows[0].value`)
      .find("input")
      .simulate("change", {
        target: { name: `${name}[1].rows[0].value`, value: "VALUE_3" }
      });

    // form submission
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    // Formik should have the updated value.
    expect(mockSubmit).lastCalledWith({
      blocks: [
        {
          rows: [
            {
              type: "TYPE_OPTION_1",
              unit: "UNIT_OPTION_1",
              value: "VALUE_1"
            },
            {
              type: "TYPE_OPTION_2",
              unit: "UNIT_OPTION_2",
              value: "VALUE_2"
            }
          ],
          select: "BLOCK_OPTION_1"
        },
        {
          rows: [
            {
              type: "TYPE_OPTION_3",
              unit: "UNIT_OPTION_3",
              value: "VALUE_3"
            }
          ],
          select: "BLOCK_OPTION_2"
        }
      ]
    });
  });
});
