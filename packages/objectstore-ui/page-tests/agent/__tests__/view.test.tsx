import { AgentDetailsPage } from "../../../pages/agent/view";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Agent } from "../../../types/objectstore-api/resources/Agent";

/** Test agent with all fields defined. */
const TEST_AGENT: Agent = {
  displayName: "agent a",
  email: "testagent@a.b",
  id: "1",
  type: "agent",
  uuid: "323423-23423-234"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return { data: TEST_AGENT };
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

// Mock API requests:
const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("Agent details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(
      <AgentDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the Agent details", async () => {
    const wrapper = mountWithAppContext(
      <AgentDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The agent's name should be rendered in a FieldView.
    expect(
      wrapper.containsMatchingElement(<strong>Display Name</strong>)
    ).toEqual(true);
    expect(wrapper.containsMatchingElement(<p>agent a</p>)).toEqual(true);

    // The agent's email should be rendered in a FieldView.
    expect(wrapper.containsMatchingElement(<strong>Email</strong>)).toEqual(
      true
    );
    expect(wrapper.containsMatchingElement(<p>testagent@a.b</p>)).toEqual(true);
  });
});
