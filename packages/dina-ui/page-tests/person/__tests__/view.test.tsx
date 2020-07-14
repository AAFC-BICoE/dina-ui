import { PersonDetailsPage } from "../../../pages/person/view";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Person } from "../../../types/objectstore-api/resources/Person";

/** Test person with all fields defined. */
const TEST_AGENT: Person = {
  displayName: "person a",
  email: "testperson@a.b",
  id: "1",
  type: "person",
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

describe("Person details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(
      <PersonDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the Person details", async () => {
    const wrapper = mountWithAppContext(
      <PersonDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The person's name should be rendered in a FieldView.
    expect(
      wrapper.containsMatchingElement(<strong>Display Name</strong>)
    ).toEqual(true);
    expect(wrapper.containsMatchingElement(<p>person a</p>)).toEqual(true);

    // The person's email should be rendered in a FieldView.
    expect(wrapper.containsMatchingElement(<strong>Email</strong>)).toEqual(
      true
    );
    expect(wrapper.containsMatchingElement(<p>testperson@a.b</p>)).toEqual(
      true
    );
  });
});
