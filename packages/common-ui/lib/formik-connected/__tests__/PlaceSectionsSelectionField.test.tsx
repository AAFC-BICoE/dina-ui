import React from "react";
import { DinaForm } from "../..";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { PlaceSectionsSelectionField } from "../PlaceSectionsSelectionField";

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
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ srcAdminLevels: TEST_SRC_ADMIN_LEVELS }}>
        <PlaceSectionsSelectionField
          name="srcAdminLevels"
          hideSelectionCheckBox={true}
        />
      </DinaForm>
    );

    await new Promise(setImmediate);
    wrapper.update();

    const rows = wrapper.find("tbody tr");
    expect(rows.length).toEqual(4);
    expect(
      rows
        .first()
        .find("td")
        .map((cell) => cell.text())
    ).toEqual(["Ottawa"]);

    expect(
      rows
        .last()
        .find("td")
        .map((cell) => cell.text())
    ).toEqual(["Eastern Ontario"]);
  });
});
