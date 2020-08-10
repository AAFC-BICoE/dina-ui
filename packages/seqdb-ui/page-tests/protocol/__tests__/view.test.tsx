import { ProtocolDetailsPage } from "../../../pages/protocol/view";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import {
  Protocol,
  protocolTypeLabels
} from "../../../types/seqdb-api/resources/Protocol";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

const TEST_PROTOCOL: Protocol = {
  id: "4",
  kit: { name: "test kit", type: "product" },
  name: "Test Protocol",
  type: protocolTypeLabels.COLLECTION_EVENT
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_PROTOCOL
  };
});

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

describe("Protocol details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(
      <ProtocolDetailsPage router={{ query: { id: "100" } } as any} />
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the Protocol details", async () => {
    const wrapper = mountWithAppContext(
      <ProtocolDetailsPage router={{ query: { id: "100" } } as any} />
    );

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The protol's name should be rendered in a FieldView.
    expect(wrapper.containsMatchingElement(<strong>Name</strong>)).toEqual(
      true
    );
    expect(wrapper.containsMatchingElement(<p>Test Protocol</p>)).toEqual(true);
    wrapper.debug();

    // The protol's kit name should be rendered in a FieldView.
    expect(wrapper.containsMatchingElement(<strong>Kit Name</strong>)).toEqual(
      true
    );
    expect(wrapper.containsMatchingElement(<p>test kit</p>)).toEqual(true);
  });
});
