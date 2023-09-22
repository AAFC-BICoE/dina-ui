import React from "react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { FieldExtensionSelectField } from "../FieldExtensionSelectField";
import Select from "react-select/base";

const TEST_FIELD_EXTENTION_DATA = {
  data: {
    id: "cfia_ppc",
    type: "extension",
    extension: {
      name: "CFIA Plant pest containment",
      key: "cfia_ppc",
      version: "2022-02",
      fields: [
        {
          term: "level",
          name: "Plant Pest Containment Level",
          definition: "Plant Pest Containment",
          acceptedValues: ["Level 1 (PPC-1)", "Level 2 (PPC-2)"],
          dinaComponent: "RESTRICTION"
        }
      ]
    }
  }
};

const mockGet = jest.fn(async (path) => {
  if (path === "test-path/extension/cfia_ppc") {
    return { data: TEST_FIELD_EXTENTION_DATA.data };
  }
});

const mockSave = jest.fn();

const apiContext: any = {
  apiClient: { get: mockGet },
  save: mockSave
};
describe("FieldExtensionSelectField component", () => {
  it("Renders the FieldExtensionSelectField's options correctly.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <FieldExtensionSelectField
          name="cfia_ppc"
          className="col-md-6 field-extention"
          query={() => ({
            path: "test-path/extension/cfia_ppc"
          })}
        />
      </DinaForm>,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGet).lastCalledWith("test-path/extension/cfia_ppc", {});

    const option = wrapper.find<any>(Select).prop("options")[1];

    expect(option.label).toEqual("Level 1 (PPC-1)");
    expect(option.value).toEqual({
      extKey: "cfia_ppc",
      extTerm: "level",
      extVersion: "2022-02",
      value: "Level 1 (PPC-1)"
    });
  });
});
