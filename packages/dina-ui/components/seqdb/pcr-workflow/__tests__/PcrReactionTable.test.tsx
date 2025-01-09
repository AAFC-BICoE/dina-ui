import { DinaForm } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { PcrReactionTable } from "../PcrReactionTable";
import {
  MATERIAL_SAMPLES,
  PCR_BATCH_ITEMS
} from "../__mocks__/PcrWorkflowMocks";
import "@testing-library/jest-dom";

describe("PcrReactionTable component", () => {
  beforeEach(jest.clearAllMocks);

  test("Table renders correctly with mocked API calls", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <PcrReactionTable
          materialSamples={MATERIAL_SAMPLES as any}
          pcrBatchItems={PCR_BATCH_ITEMS}
        />
      </DinaForm>
    );

    await new Promise(setImmediate);

    const tableRows = wrapper.getAllByRole("row");
    expect(tableRows).toHaveLength(31); // 30 + header

    const expectedWellCoordinates = [
      "A1",
      "A2",
      "A3",
      "A4",
      "A5",
      "B1",
      "B2",
      "B3",
      "B4",
      "B5",
      "C1",
      "C2",
      "C3",
      "C4",
      "C5",
      "D1",
      "D2",
      "D3",
      "D4",
      "D5",
      "E1",
      "E2",
      "E3",
      "E4",
      "E5",
      "F1",
      "F2",
      "F3",
      "F4",
      "F5"
    ];
    expectedWellCoordinates.forEach((cellData, index) => {
      // Verify the well coordinates.
      expect(wrapper.getByRole("cell", { name: cellData })).toBeInTheDocument();

      // Verify the tube number and primary id.
      expect(
        wrapper.getAllByRole("cell", { name: index + 1 + "" }).length
      ).toBe(2);
    });

    expect(
      wrapper.getAllByRole("cell", { name: /scientificname/i }).length
    ).toBe(30);
    expect(wrapper.getAllByRole("cell", { name: "Good Band" }).length).toBe(5);
    expect(wrapper.getAllByRole("cell", { name: "Weak Band" }).length).toBe(5);
    expect(
      wrapper.getAllByRole("cell", { name: "Multiple Bands" }).length
    ).toBe(5);
    expect(wrapper.getAllByRole("cell", { name: "Contaminated" }).length).toBe(
      5
    );
    expect(wrapper.getAllByRole("cell", { name: "Smear" }).length).toBe(5);
    expect(wrapper.getAllByRole("cell", { name: "Custom Result" }).length).toBe(
      1
    );
  });
});
