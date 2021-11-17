import { DinaForm, NumberField } from "common-ui";
import NumberFormat from "react-number-format";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { SetCoordinatesFromVerbatimButton } from "../SetCoordinatesFromVerbatimButton";

describe("SetCoordinatesFromVerbatimButton component", () => {
  it("Sets the lat/lon from the verbatim fields.", async () => {
    const onClickCallback = jest.fn();

    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          verbatimLatitude: "45°32′25″N",
          verbatimLongitude: "129°40′31″W",
          decimalLatitude: "",
          decimalLongitude: ""
        }}
      >
        <SetCoordinatesFromVerbatimButton
          sourceLatField="verbatimLatitude"
          sourceLonField="verbatimLongitude"
          targetLatField="decimalLatitude"
          targetLonField="decimalLongitude"
          onClick={onClickCallback}
        >
          Test Button
        </SetCoordinatesFromVerbatimButton>
        <NumberField name="decimalLatitude" />
        <NumberField name="decimalLongitude" />
      </DinaForm>
    );

    wrapper.find("button").simulate("click");

    wrapper.update();

    expect(
      wrapper.find(".decimalLatitude-field").find(NumberFormat).prop("value")
    ).toEqual(45.540278);
    expect(
      wrapper.find(".decimalLongitude-field").find(NumberFormat).prop("value")
    ).toEqual(-129.675278);

    expect(onClickCallback).lastCalledWith({
      lat: 45.540278,
      lon: -129.675278
    });
  });
});
