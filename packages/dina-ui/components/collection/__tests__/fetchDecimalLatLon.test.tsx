import { DinaForm, FormikButton } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import {
  CanadensysResponse,
  fetchDecimalLatLonFromVerbatim
} from "../fetchDecimalLatLon";
import { get } from "lodash";

// Implement needed fields:
const MOCK_CANADENSYS_RESPONSE: CanadensysResponse = {
  features: [
    {
      geometry: {
        coordinates: [-129.6752778, 45.5402778]
      }
    }
  ]
};

describe("setLatLonFromVerbatim function", () => {
  it("Sets the lat/lon from the api.", async () => {
    const mockCallbackOnCoordsFetched = jest.fn();
    const mockFetchJson = jest.fn(async () => MOCK_CANADENSYS_RESPONSE);

    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          verbatimLatitude: "45°32'25\"N",
          verbatimLongitude: "129°40'31\"W"
        }}
      >
        <FormikButton
          onClick={async values => {
            const verbatimLat = get(values, "verbatimLatitude");
            const verbatimLon = get(values, "verbatimLongitude");
            await fetchDecimalLatLonFromVerbatim({
              onDecimalCoordsFetched: mockCallbackOnCoordsFetched,
              fetchJson: mockFetchJson,
              verbatimCoords: { lat: verbatimLat, lon: verbatimLon }
            });
          }}
        />
      </DinaForm>
    );

    wrapper.find("button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockCallbackOnCoordsFetched).toHaveBeenCalledTimes(1);
    expect(mockCallbackOnCoordsFetched).lastCalledWith({
      lat: 45.5402778,
      lon: -129.6752778
    });

    expect(mockFetchJson).toHaveBeenCalledTimes(1);
    expect(mockFetchJson).lastCalledWith(
      "https://data.canadensys.net/tools/coordinates.json?data=45%C2%B032%2725%22N%2C129%C2%B040%2731%22W"
    );
  });
});
