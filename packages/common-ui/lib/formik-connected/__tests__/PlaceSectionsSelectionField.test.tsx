import React from "react";
import { DinaForm } from "../..";
import { mountWithAppContext } from "common-ui";
import { PlaceSectionsSelectionField } from "../PlaceSectionsSelectionField";
import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/react";

const TEST_SRC_ADMIN_LEVELS = [
  {
    id: "18886011",
    element: "N",
    placeType: "place",
    name: "Ottawa"
  },
  {
    id: "9244979",
    element: "R",
    placeType: "boundary",
    name: "(Old) Ottawa"
  },
  {
    id: "4136816",
    element: "R",
    placeType: "county",
    name: "Ottawa"
  },
  {
    id: "9330323",
    element: "R",
    placeType: "boundary",
    name: "Eastern Ontario"
  }
];

describe("PlaceSectionSelectionField component", () => {
  beforeEach(jest.clearAllMocks);

  it("Display Src Admin Levels to table.", async () => {
    mountWithAppContext(
      <DinaForm initialValues={{ srcAdminLevels: TEST_SRC_ADMIN_LEVELS }}>
        <PlaceSectionsSelectionField
          name="srcAdminLevels"
          hideSelectionCheckBox={true}
        />
      </DinaForm>
    );

    // Wait for the table rows to be rendered
    await waitFor(() => expect(screen.getAllByRole("row").length).toEqual(5)); // Header + 4 rows

    const rows = screen.getAllByRole("row").slice(1); // Ignore the header row

    // Assert the first row contains "Ottawa"
    expect(rows[0]).toHaveTextContent("Ottawa");

    // Assert the last row contains "Eastern Ontario"
    expect(rows[rows.length - 1]).toHaveTextContent("Eastern Ontario");
  });
});
