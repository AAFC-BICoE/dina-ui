import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { ViewInMapButton } from "../GeoReferenceAssertionRow";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("ViewInMapButton component", () => {
  it("Shows the map link.", async () => {
    const { container } = mountWithAppContext(
      <DinaForm
        initialValues={{
          assertion: {
            dwcDecimalLatitude: 45.3930327,
            dwcDecimalLongitude: -75.7098208
          }
        }}
      >
        <ViewInMapButton assertionPath="assertion" />
      </DinaForm>
    );

    // Wait for the component to render
    await new Promise(setImmediate);

    // Use getByRole or getByText to select the anchor tag
    const link = screen.getByRole("link", {
      name: /view on map/i
    });

    // Check the href attribute of the link
    expect(link).toHaveAttribute(
      "href",
      "/collection/collecting-event/map?mlat=45.3930327&mlon=-75.7098208"
    );
  });

  it("Shows nothing when a lat or lon is blank.", async () => {
    const { container } = mountWithAppContext(
      <DinaForm
        initialValues={{
          assertion: {
            dwcDecimalLatitude: 45.3930327,
            dwcDecimalLongitude: null
          }
        }}
      >
        <ViewInMapButton assertionPath="assertion" />
      </DinaForm>
    );

    // Wait for the component to render
    await new Promise(setImmediate);

    // Check that the link is not present in the document
    const link = screen.queryByRole("link", {
      name: /view in map/i // Adjust this text if necessary
    });

    expect(link).not.toBeInTheDocument();
  });
});
