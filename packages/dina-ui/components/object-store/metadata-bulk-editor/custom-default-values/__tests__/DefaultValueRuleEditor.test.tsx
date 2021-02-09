import { deleteFromStorage, writeStorage } from "@rehooks/local-storage";
import { mountWithAppContext } from "../../../../../test-util/mock-app-context";
import { DefaultValueRuleEditor } from "../DefaultValueRuleEditor";
import { DefaultValuesConfig } from "../model-types";
import { DefaultValueRuleEditorRow } from "../DefaultValueRuleEditorRow";
import Select from "react-select";

const STORAGE_KEY = "metadata_defaultValuesConfigs";

const TEST_CONFIGS: DefaultValuesConfig[] = [
  {
    name: "initial-name",
    createdOn: "test-date",
    defaultValueRules: []
  }
];

describe("DefaultValueRuleEditor component", () => {
  beforeEach(() => {
    // Reset "local storage":
    deleteFromStorage(STORAGE_KEY);
    writeStorage(STORAGE_KEY, TEST_CONFIGS);
  });

  it("Saves the Default Values Config details.", async () => {
    const wrapper = mountWithAppContext(<DefaultValueRuleEditor />);

    // Change the name value.
    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "test-config" } });

    // Add 2 Default Value Rules
    wrapper.find("button.add-rule-button").simulate("click");
    wrapper.update();
    wrapper.find("button.add-rule-button").simulate("click");
    wrapper.update();

    const firstRow = () => wrapper.find(DefaultValueRuleEditorRow).at(0);

    // Set the target field to acCaption:
    firstRow().find(".target-field-field").find(Select).prop<any>("onChange")({
      value: "metadata.acCaption"
    });

    // Set to be text source:
    firstRow().find(".source-type-field").find(Select).prop<any>("onChange")({
      value: "text"
    });
    wrapper.update();

    // Set the hard-coded text source:
    firstRow()
      .find(".source-text-field input")
      .simulate("change", { target: { value: "test text source" } });

    const secondRow = () => wrapper.find(DefaultValueRuleEditorRow).at(1);

    // acTags target Field:
    secondRow().find(".target-field-field").find(Select).prop<any>("onChange")({
      value: "metadata.acTags"
    });

    // objectUploadField source:
    secondRow().find(".source-type-field").find(Select).prop<any>("onChange")({
      value: "objectUploadField"
    });
    wrapper.update();

    // Set the source ObjectUpload field:
    secondRow().find(".source-field-field").find(Select).prop<any>("onChange")({
      value: "originalFilename"
    });
    wrapper.update();

    // Submit the form:
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    const EXPECTED_DEFAULT_VALUES_CONFIG: DefaultValuesConfig = {
      createdOn: "test-date",
      defaultValueRules: [
        {
          source: {
            text: "test text source",
            type: "text"
          },
          targetField: "metadata.acCaption"
        },
        {
          source: {
            field: "originalFilename",
            type: "objectUploadField"
          },
          targetField: "metadata.acTags"
        }
      ],
      name: "test-config"
    };

    // The new Rules should be persisted:
    expect(JSON.parse(String(localStorage.getItem(STORAGE_KEY)))).toEqual([
      EXPECTED_DEFAULT_VALUES_CONFIG
    ]);
  });
});
