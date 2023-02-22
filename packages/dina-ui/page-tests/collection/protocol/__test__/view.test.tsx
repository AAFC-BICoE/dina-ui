import ProtocolDetailsPage from "../../../../pages/collection/protocol/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Protocol } from "../../../../types/collection-api/resources/Protocol";

/** Test protocol with all fields defined. */
const TEST_PROTOCOL: Protocol = {
  id: "1",
  name: "test protocol",
  type: "protocol"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn<any, any>(async (model) => {
  // The get request will return the existing protocol.
  if (model === "collection-api/protocol/100") {
    return { data: TEST_PROTOCOL };
  } else if (model === "collection-api/protocol-element") {
    return {
      data: [
        {
          id: "concentration",
          type: "protocol-element",
          attributes: {
            term: "http://www.wikidata.org/entity/Q3686031",
            vocabularyElementType: "DECIMAL",
            multilingualTitle: {
              titles: [
                { lang: "en", title: "Concentration" },
                { lang: "fr", title: "Concentration" }
              ]
            }
          }
        },
        {
          id: "quantity",
          type: "protocol-element",
          attributes: {
            term: "http://www.wikidata.org/entity/Q309314",
            vocabularyElementType: "DECIMAL",
            multilingualTitle: {
              titles: [
                { lang: "en", title: "Quantity" },
                { lang: "fr", title: "Quantité" }
              ]
            }
          }
        }
      ]
    };
  }
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

// Mock API requests:
const apiContext = {
  apiClient: { get: mockGet }
};

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "100" } })
}));

describe("Protocol details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<ProtocolDetailsPage />, {
      apiContext
    });

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the Protocol details", async () => {
    const wrapper = mountWithAppContext(<ProtocolDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    expect(wrapper.find(".name-field .field-view").text()).toEqual(
      "test protocol"
    );
  });
});
