import { mount } from "enzyme";
import { ApiClientContext, createContextValue } from "../../../components";
import { ProtocolDetailsPage } from "../../../pages/protocol/view";
import { Protocol } from "../../../types/seqdb-api/resources/Protocol";
import { ProtocolTypes } from "../../../types/seqdb-api/resources/ProtocolTypes";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

const TEST_PROTOCOL: Protocol = {
  group: { id: "1", groupName: "Test Group", type: "group" },
  id: "4",
  name: "Test Protocol",
  type: ProtocolTypes.COLLECTION_EVENT,
  kit: { name: "test kit", type: "product" }
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
  function mountWithContext(element: JSX.Element) {
    return mount(
      <ApiClientContext.Provider value={createContextValue()}>
        {element}
      </ApiClientContext.Provider>
    );
  }

  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithContext(
      <ProtocolDetailsPage router={{ query: { id: "100" } } as any} />
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the Protocol details", async () => {
    const wrapper = mountWithContext(
      <ProtocolDetailsPage router={{ query: { id: "100" } } as any} />
    );

    // Wait for the page to load.
    await Promise.resolve();
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The protol's name should be rendered in a FieldView.
    expect(
      wrapper.containsMatchingElement(
        <div>
          <label>
            <strong>Name</strong>
          </label>
          <p>Test Protocol</p>
        </div>
      )
    ).toEqual(true);
    wrapper.debug()
    // The protol's kit name should be rendered in a FieldView.
    expect(
      wrapper.containsMatchingElement(
        <div>
          <label>
            <strong>Kit Name</strong>
          </label>
          <p>test kit</p>
        </div>
      )
    ).toEqual(true);

  });
});
