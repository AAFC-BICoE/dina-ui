import { DinaForm } from "../../../../common-ui/lib";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { VocabularySelectField } from "../VocabularySelectField";
import CreatableSelect from "react-select/creatable";

const mockOnSubmit = jest.fn();

describe("VocabularySelectField component", () => {
  it("Renders and sets values correctly", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ fieldName: ["val1", "val2", "val3"] }}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <VocabularySelectField
          name="fieldName"
          path="collection-api/vocabulary/substrate"
        />
      </DinaForm>
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(CreatableSelect).prop("value")).toEqual([
      { label: "val1", value: "val1" },
      { label: "val2", value: "val2" },
      { label: "val3", value: "val3" }
    ]);

    wrapper.find(CreatableSelect).prop<any>("onChange")([
      { label: "new-val-1", value: "new-val-1" },
      { label: "new-val-2", value: "new-val-2" }
    ]);

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(CreatableSelect).prop("value")).toEqual([
      { label: "new-val-1", value: "new-val-1" },
      { label: "new-val-2", value: "new-val-2" }
    ]);

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // The value was converted to an array:
    expect(mockOnSubmit).lastCalledWith({
      fieldName: ["new-val-1", "new-val-2"]
    });
  });
});
