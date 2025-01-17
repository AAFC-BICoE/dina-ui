import { SUPER_USER, USER } from "common-ui/types/DinaRoles";
import DinaUserDetailsPage from "../../../pages/dina-user/view";
import { mountWithAppContext } from "common-ui";
import { Person } from "../../../types/objectstore-api";
import { DinaUser } from "../../../types/user-api/resources/DinaUser";
import "@testing-library/jest-dom";

/** Test dina user with all fields defined. */
const TEST_DINAUSER: DinaUser = {
  username: "cnc-cm",
  emailAddress: "a.b@c.d",
  groups: ["dao", "cnc"],
  roles: ["/dao/" + USER, "/cnc/" + SUPER_USER],
  agentId: "e3a18289-4a9d-4ad6-ad06-3c7f1837406e",
  id: "1",
  type: "user",
  rolesPerGroup: { cnc: [SUPER_USER] }
};

const TEST_AGENT: Person = {
  displayName: "person a",
  email: "testperson@a.b",
  id: "1",
  type: "person",
  uuid: "323423-23423-234"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return { data: TEST_DINAUSER };
});

const mockBulkGet = jest.fn(async (paths) => {
  return paths.map((path) => {
    if (path.startsWith("person")) {
      return TEST_AGENT;
    }
    console.error("No mocked bulkGet response: ", paths);
  });
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

// Pretend we are at the page for index set id#100
jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "1" } })
}));

// Mock API requests:
const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet
};

describe("Dina user who am i page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<DinaUserDetailsPage />, {
      apiContext
    });

    // expect(wrapper.find(".spinner-border").exists()).toEqual(true);
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Render the dina user details", async () => {
    const wrapper = mountWithAppContext(<DinaUserDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await wrapper.waitForRequests();

    // expect(wrapper.find(".spinner-border").exists()).toEqual(false);
    expect(wrapper.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();

    // The dina username should be rendered in a FieldView.
    expect(wrapper.getByRole("heading", { name: /user/i })).toBeInTheDocument();
    expect(wrapper.getByText(/cnc\-cm/i)).toBeInTheDocument();
  });
});
