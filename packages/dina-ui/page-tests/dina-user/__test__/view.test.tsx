import { DinaUser } from "../../../types/objectstore-api/resources/DinaUser";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import DinaUserDetailsPage from "../../../pages/dina-user/view";

/** Test dina user with all fields defined. */
const TEST_DINAUSER: DinaUser = {
  username: "cnc-cm",
  emailAddress: "a.b@c.d",
  groups: ["dao", "cnc"],
  roles: ["/dao/staff", "/cnd/collection-manager"],
  agentId: "e3a18289-4a9d-4ad6-ad06-3c7f1837406e",
  id: "1",
  type: "user"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return { data: TEST_DINAUSER };
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

// Mock API requests:
const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("Dina user who am i page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<DinaUserDetailsPage />, {
      apiContext
    });

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the dina user details", async () => {
    const wrapper = mountWithAppContext(<DinaUserDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The dina username should be rendered in a FieldView.
    expect(wrapper.containsMatchingElement(<strong>Username</strong>)).toEqual(
      true
    );
    expect(wrapper.containsMatchingElement(<p>cnc-cm</p>)).toEqual(true);

    // The dina user's email should be rendered in a FieldView.
    expect(
      wrapper.containsMatchingElement(<strong>Email Address</strong>)
    ).toEqual(true);
    expect(wrapper.containsMatchingElement(<p>a.b@c.d</p>)).toEqual(true);

    // The dina user's groups should be rendered in a FieldView.
    expect(wrapper.containsMatchingElement(<strong>Groups</strong>)).toEqual(
      true
    );
    expect(wrapper.containsMatchingElement(<p>dao,cnc</p>)).toEqual(true);

    // The dina user's roles should be rendered in a FieldView.
    expect(wrapper.containsMatchingElement(<strong>Roles</strong>)).toEqual(
      true
    );
    expect(
      wrapper.containsMatchingElement(<p>/dao/staff,/cnd/collection-manager</p>)
    ).toEqual(true);
  });
});
