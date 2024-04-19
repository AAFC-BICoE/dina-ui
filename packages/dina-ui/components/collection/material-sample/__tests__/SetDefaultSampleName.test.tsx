import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { SetDefaultSampleName } from "../SetDefaultSampleName";
import { CollectionSelectSection } from "../../CollectionSelectSection";
import { MaterialSampleIdentifiersSection } from "../MaterialSampleIdentifiersSection";

const mockGet = jest.fn<any, any>(async (path) => {
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
        <MaterialSampleIdentifiersSection />
        <CollectionSelectSection resourcePath="collection-api/collection" />
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

  it("Doesn't change the sample name when it already starts with the prefix.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          materialSampleName: "INITIAL-CODE-100",
          collection: { id: "1", type: "collection", code: "INITIAL-CODE" }
        }}
      >
        <SetDefaultSampleName />
        <MaterialSampleIdentifiersSection />
        <CollectionSelectSection resourcePath="collection-api/collection" />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Initial value is correct to begin with so isn't altered:
    expect(
      wrapper.find(".materialSampleName-field input").prop("value")
    ).toEqual("INITIAL-CODE-100");
  });
});
