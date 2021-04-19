import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { ViewInMapButton } from "../GeoReferenceAssertionRow";

describe("ViewInMapButton component", () => {
  it("Shows the map link.", async () => {
    const wrapper = mountWithAppContext(
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

    expect(wrapper.find("a").prop("href")).toEqual(
      "https://www.openstreetmap.org/?mlat=45.3930327&mlon=-75.7098208"
    );
  });

  it("Shows nothing when a lat or lon is blank.", async () => {
    const wrapper = mountWithAppContext(
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

    expect(wrapper.find("a").exists()).toEqual(false);
  });
});
