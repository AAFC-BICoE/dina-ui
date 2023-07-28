import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { PcrReactionTable } from "../PcrReactionTable";
import {
  MATERIAL_SAMPLES,
  PCR_BATCH_ITEMS
} from "../__mocks__/PcrWorkflowMocks";

describe("PcrReactionTable component", () => {
  beforeEach(jest.clearAllMocks);

  test("Table renders correctly with mocked API calls", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}} readOnly={true}>
        <PcrReactionTable
          materialSamples={MATERIAL_SAMPLES}
          pcrBatchItems={PCR_BATCH_ITEMS}
        />
      </DinaForm>
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Ensure well coordinates are displayed correctly
    let rowNumber = 0;
    wrapper
      .find("ReactTable")
      .find(".rt-tr-group")
      .forEach((row) => {
        // Well coordinates
        expect(row.find(".rt-td").at(0).text()).toEqual(
          PCR_BATCH_ITEMS?.[rowNumber]?.wellRow +
            "" +
            PCR_BATCH_ITEMS?.[rowNumber]?.wellColumn
        );

        // Tube Number
        expect(row.find(".rt-td").at(1).text()).toEqual(
          "" + PCR_BATCH_ITEMS?.[rowNumber]?.cellNumber
        );

        // Primary ID
        expect(row.find(".rt-td").at(2).text()).toEqual(
          "" + MATERIAL_SAMPLES?.[rowNumber]?.materialSampleName
        );

        // Scientific Name
        expect(row.find(".rt-td").at(3).text()).toEqual("scientificName");

        // Result
        expect(row.find(".rt-td").at(4).html()).toMatchSnapshot(
          `result band for row number: ${rowNumber}`
        );
        rowNumber++;
      });
  });
});
