import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { ParseVerbatimToRangeButton } from "../ParseVerbatimToRangeButton";

const mockSubmit = jest.fn();

describe("ParseVerbatimToRangeButton component", () => {
  it("Sets the range from two detected values when there is no current min value.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ verbatim: "1m to 20m " }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <ParseVerbatimToRangeButton
          buttonText="buttonText"
          rangeFields={["min", "max"]}
          verbatimField="verbatim"
        />
      </DinaForm>
    );

    wrapper.find("button").simulate("click");
    await new Promise(setImmediate);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockSubmit).lastCalledWith({
      verbatim: "1m to 20m ",
      min: "1",
      max: "20"
    });
  });

  it("Only sets the min when there is one detected value.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ verbatim: "1m " }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <ParseVerbatimToRangeButton
          buttonText="buttonText"
          rangeFields={["min", "max"]}
          verbatimField="verbatim"
        />
      </DinaForm>
    );

    wrapper.find("button").simulate("click");
    await new Promise(setImmediate);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockSubmit).lastCalledWith({
      verbatim: "1m ",
      min: "1"
    });
  });
});
