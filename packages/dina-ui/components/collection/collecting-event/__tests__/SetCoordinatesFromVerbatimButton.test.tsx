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

  it("Displays an error when coordinates cannot be parsed.", async () => {
    const onClickCallback = jest.fn();

    mountWithAppContext(
      <DinaForm
        initialValues={{
          verbatimLatitude: "Not a coordinate",
          verbatimLongitude: "Also invalid",
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

    const button = screen.getByRole("button", { name: /test button/i });
    fireEvent.click(button);

    // Wait for the error message
    await waitFor(() => {
      expect(
        screen.getByText(
          /Coordinate contains invalid alphanumeric characters./i
        )
      ).toBeInTheDocument();
    });

    // Ensure values were NOT updated
    const latitudeInput = screen.getByRole("textbox", {
      name: /decimal latitude/i
    }) as HTMLInputElement;
    const longitudeInput = screen.getByRole("textbox", {
      name: /decimal longitude/i
    }) as HTMLInputElement;

    expect(latitudeInput.value).toEqual("");
    expect(longitudeInput.value).toEqual("");
    expect(onClickCallback).not.toHaveBeenCalled();
  });

  it("Displays an error when coordinates are out of bounds (Latitude > 90).", async () => {
    const onClickCallback = jest.fn();

    mountWithAppContext(
      <DinaForm
        initialValues={{
          // 91 degrees is invalid
          verbatimLatitude: "91",
          verbatimLongitude: "100",
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

    const button = screen.getByRole("button", { name: /test button/i });
    fireEvent.click(button);

    await waitFor(() => {
      const errorContainer = screen.getByText((_content, element) => {
        return (
          element?.tagName.toLowerCase() === "span" &&
          element.classList.contains("text-danger")
        );
      });
      expect(errorContainer).toBeInTheDocument();
    });

    // Ensure values were NOT updated
    const latitudeInput = screen.getByRole("textbox", {
      name: /decimal latitude/i
    }) as HTMLInputElement;
    expect(latitudeInput.value).toEqual("");
    expect(onClickCallback).not.toHaveBeenCalled();
  });

  it("Displays an error when coordinates are out of bounds (Longitude > 180).", async () => {
    const onClickCallback = jest.fn();

    mountWithAppContext(
      <DinaForm
        initialValues={{
          verbatimLatitude: "45",
          // 190 degrees is invalid
          verbatimLongitude: "190",
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

    const button = screen.getByRole("button", { name: /test button/i });
    fireEvent.click(button);

    // Wait for validation error message
    await waitFor(() => {
      const errorContainer = screen.getByText((_content, element) => {
        return (
          element?.tagName.toLowerCase() === "span" &&
          element.classList.contains("text-danger")
        );
      });
      expect(errorContainer).toBeInTheDocument();
    });

    // Ensure values were NOT updated
    const longitudeInput = screen.getByRole("textbox", {
      name: /decimal longitude/i
    }) as HTMLInputElement;
    expect(longitudeInput.value).toEqual("");
    expect(onClickCallback).not.toHaveBeenCalled();
  });

  it("Disables the button when verbatim coordinates are empty.", async () => {
    mountWithAppContext(
      <DinaForm
        initialValues={{
          verbatimLatitude: "",
          verbatimLongitude: "",
          decimalLatitude: "",
          decimalLongitude: ""
        }}
      >
        <SetCoordinatesFromVerbatimButton
          sourceLatField="verbatimLatitude"
          sourceLonField="verbatimLongitude"
          targetLatField="decimalLatitude"
          targetLonField="decimalLongitude"
          buttonText="Test Button"
        />
      </DinaForm>
    );

    const button = screen.getByRole("button", { name: /test button/i });

    // The button should be disabled because the source fields are empty
    expect(button).toBeDisabled();
  });
});
