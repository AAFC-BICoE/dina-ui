import { DinaForm } from "../../../../common-ui/lib";
import { MaterialSampleIdentifiersFormLayout } from "../../../pages/collection/material-sample/edit";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { SetDefaultSampleName } from "../SetDefaultSampleName";

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/collection":
      return { data: [] };
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet
    }
  }
};

describe("SetDefaultSampleName", () => {
  it("Sets the sample name based on the selected Collection.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          materialSampleName: "",
          collection: { id: "1", type: "collection", code: "INITIAL-CODE" }
        }}
      >
        <SetDefaultSampleName />
        <MaterialSampleIdentifiersFormLayout />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Initial value:
    expect(
      wrapper.find(".materialSampleName-field input").prop("value")
    ).toEqual("INITIAL-CODE");

    wrapper
      .find(".materialSampleName-field input")
      .simulate("change", { target: { value: "INITIAL-CODE-my_custom_name" } });
    // Initial code with custom name:
    expect(
      wrapper.find(".materialSampleName-field input").prop("value")
    ).toEqual("INITIAL-CODE-my_custom_name");

    // Change the collection:
    wrapper.find(".collection-field ResourceSelect").prop<any>("onChange")({
      id: "2",
      type: "collection",
      code: "TEST_CODE_2"
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Initial value:
    expect(
      wrapper.find(".materialSampleName-field input").prop("value")
    ).toEqual("TEST_CODE_2-my_custom_name");
  });
});
