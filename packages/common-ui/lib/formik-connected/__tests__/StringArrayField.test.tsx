import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { FormikButton } from "../FormikButton";
import { StringArrayField } from "../StringArrayField";

const mockSubmit = jest.fn();

describe("StringArrayField component", () => {
  beforeEach(jest.clearAllMocks);

  it("Edits the array field using a textarea.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ lines: ["line1", "line2", "line3"] }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <StringArrayField name="lines" />
      </DinaForm>
    );

    expect(wrapper.find("textarea").prop("value")).toEqual(
      ["line1", "line2", "line3", ""].join("\n")
    );

    wrapper.find("textarea").simulate("change", {
      target: { value: ["line1", "line2", "line3", "", "line4"].join("\n") }
    });

    wrapper.find("form").simulate("submit");

    wrapper.update();
    await new Promise(setImmediate);

    expect(mockSubmit.mock.calls).toEqual([
      [{ lines: ["line1", "line2", "line3", "line4"] }]
    ]);
  });

  it("Displays the right value when the form state changes.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ lines: ["line1", "line2", "line3"] }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <StringArrayField name="lines" />
        <FormikButton
          onClick={(_, form) => form.setFieldValue("lines", ["new", "value"])}
        >
          Set new field value
        </FormikButton>
      </DinaForm>
    );

    wrapper.find("button").simulate("click");
    wrapper.find("form").simulate("submit");

    wrapper.update();
    await new Promise(setImmediate);

    expect(mockSubmit.mock.calls).toEqual([[{ lines: ["new", "value"] }]]);
  });
});
