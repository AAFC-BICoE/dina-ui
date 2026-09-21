import { mountWithAppContext } from "common-ui";
import { DinaForm } from "../DinaForm";
import { NumberRangeFields } from "../NumberRangeFields";
import "@testing-library/jest-dom";

describe("NumberRangeFields component", () => {
  it("Shows the range when both min and max are defined.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ minField: 1, maxField: 5 }} readOnly={true}>
        <NumberRangeFields
          names={["minField", "maxField"]}
          labelMsg={<>Test Range</>}
        />
      </DinaForm>
    );

    expect(wrapper.container.querySelector("label")?.textContent).toContain(
      "1–5m"
    );
  });

  it("Shows a dimmed label and dash placeholder when neither value is defined.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <NumberRangeFields
          names={["minField", "maxField"]}
          labelMsg={<>Test Range</>}
        />
      </DinaForm>
    );

    expect(
      wrapper.container
        .querySelector("strong")
        ?.classList.contains("field-label-empty")
    ).toEqual(true);
    expect(
      wrapper.container.querySelector(".field-value-empty")?.textContent
    ).toEqual("—");
  });
});
