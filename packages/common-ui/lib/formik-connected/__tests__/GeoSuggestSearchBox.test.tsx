import { mountWithAppContext } from "common-ui";
import { DinaForm } from "../DinaForm";
import {
  GeoSuggestSearchBox,
  NominatumApiSearchResult
} from "../GeoSuggestSearchBox";
import { fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

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
        <GeoSuggestSearchBox fetchJson={mockFetchJson} />
      </DinaForm>
    );

    // Simulate typing in the input
    const input = wrapper.getByRole("textbox");
    fireEvent.change(input, { target: { value: "ottawa" } });

    // Simulate clicking the search button
    const geosuggestButton = wrapper.getByRole("button", {
      name: /geo\-suggest/i
    });
    fireEvent.click(geosuggestButton);

    // The button should become disabled after the API request
    await waitFor(() => {
      expect(
        wrapper.container.querySelector(".geo-suggest-button")
      ).toBeDisabled();
    });

    // Verify that suggestions are rendered correctly
    const result1Button = wrapper.getByRole("button", {
      name: /result 1/i
    });
    const result2Button = wrapper.getByRole("button", {
      name: /result 2/i
    });

    // Assert that both buttons are present
    expect(result1Button).toBeInTheDocument();
    expect(result2Button).toBeInTheDocument();

    // Wait for any asynchronous behavior
    await waitFor(() => {
      expect(mockFetchJson).toHaveBeenCalledWith(
        "https://nominatim.openstreetmap.org/search?q=ottawa&addressdetails=1&format=jsonv2"
      );
    });
  });
});
