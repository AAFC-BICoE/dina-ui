import { DinaForm, NumberField } from "common-ui";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { SetCoordinatesFromVerbatimButton } from "../SetCoordinatesFromVerbatimButton";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("SetCoordinatesFromVerbatimButton component", () => {
  it("Sets the lat/lon from the verbatim fields.", async () => {
    const onClickCallback = jest.fn();

    const { container } = mountWithAppContext(
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
          buttonText="Test Button"
        />
        <NumberField name="decimalLatitude" />
        <NumberField name="decimalLongitude" />
      </DinaForm>
    );

    // Simulate button click
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Wait for state updates
    await new Promise(setImmediate);

    // Check values of decimal latitude and longitude
    const latitudeInput = screen.getByRole("textbox", {
      name: /decimal latitude/i
    }) as HTMLInputElement;
    const longitudeInput = screen.getByRole("textbox", {
      name: /decimal longitude/i
    }) as HTMLInputElement;

    expect(latitudeInput.value).toEqual("45.540278");
    expect(longitudeInput.value).toEqual("-129.675278");

    expect(onClickCallback).lastCalledWith({
      lat: "45.540278",
      lon: "-129.675278"
    });
  });
});
