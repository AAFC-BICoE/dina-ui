import Autosuggest from "react-autosuggest";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import {
  GeoSuggestTextField,
  NominatumApiSearchResult
} from "../GeoSuggestTextField";

// Mock out the KeyboardEventHandler which should only be rendered in the browser.
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent({ children }) {
    return children;
  };
});

/** Mocks the Nominatum "fetch" call. */
const mockFetchJson = jest.fn(async () => {
  const results: NominatumApiSearchResult[] = [
    {
      osm_id: 1,
      osm_type: "type1",
      category: "boundary",
      type: "administrative",
      display_name: "result 1"
    },
    {
      osm_id: 2,
      osm_type: "type2",
      category: "boundary",
      type: "administrative",
      display_name: "result 2"
    },
    {
      osm_id: 3,
      osm_type: "type3",
      category: "place",
      type: "type",
      display_name: "result 3"
    }
  ];
  return results;
});

describe("GeoSuggestTextField component", () => {
  beforeEach(jest.clearAllMocks);

  it("Fetches the suggestions from the Nominatim API.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <GeoSuggestTextField name="geoField" fetchJson={mockFetchJson} />
      </DinaForm>
    );

    wrapper.find("textarea").prop<any>("onChange")({
      target: { value: "ottawa" }
    } as any);

    await new Promise(setImmediate);
    wrapper.update();

    // Press the button:
    wrapper.find("button.geo-suggest-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Suggestions are shown in a list of buttons:
    expect(
      wrapper.find(".suggestion-list button").map(node => node.text())
    ).toEqual(["result 1", "result 2"]);

    // The correct API url shouls have been used:
    expect(mockFetchJson).lastCalledWith(
      "https://nominatim.openstreetmap.org/search.php?q=ottawa&addressdetails=1&format=jsonv2"
    );
  });
});
