import { DinaForm, NumberField } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { SetCoordinatesFromVerbatimButton } from "../SetCoordinatesFromVerbatimButton";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";

describe("SetCoordinatesFromVerbatimButton component", () => {
  it("Sets the lat/lon from the verbatim fields.", async () => {
    const onClickCallback = jest.fn();

    mountWithAppContext(
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

    // Check values of decimal latitude and longitude
    const latitudeInput = screen.getByRole("textbox", {
      name: /decimal latitude/i
    }) as HTMLInputElement;
    const longitudeInput = screen.getByRole("textbox", {
      name: /decimal longitude/i
    }) as HTMLInputElement;

    // Wait for state updates
    await waitFor(() => {
      expect(latitudeInput).toBeInTheDocument();
      expect(longitudeInput).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(latitudeInput.value).toEqual("45.540278");
      expect(longitudeInput.value).toEqual("-129.675278");

      expect(onClickCallback).lastCalledWith({
        lat: "45.540278",
        lon: "-129.675278"
      });
    });
  });
});
