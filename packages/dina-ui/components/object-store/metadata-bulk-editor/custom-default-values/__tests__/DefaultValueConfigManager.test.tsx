import Select from "react-select";
import { mountWithAppContext } from "../../../../../test-util/mock-app-context";
import { DefaultValueConfigManager } from "../DefaultValueConfigManager";
import { useState } from "react";
import { deleteFromStorage } from "@rehooks/local-storage";

function TestComponent() {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <DefaultValueConfigManager
      allowBlank={true}
      dateSupplier={() => "test-date"}
      ruleConfigIndex={index}
      onChangeConfigIndex={setIndex}
    />
  );
}

describe("DefaultValueConfigManager component", () => {
  beforeEach(() => deleteFromStorage("metadata_defaultValuesConfigs"));

  it("Lets you add and delete Configs.", () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    // Add one:
    wrapper.find("button.add-button").simulate("click");
    wrapper.update();

    expect(wrapper.find(Select).prop("options")).toEqual([
      { label: "<none>", value: null },
      {
        label: "Rule Set test-date",
        value: 0
      }
    ]);

    // Delete the one just added:
    wrapper.find("button.delete-button").simulate("click");
    wrapper.update();

    expect(wrapper.find(Select).prop("options")).toEqual([
      { label: "<none>", value: null }
    ]);
  });
});
