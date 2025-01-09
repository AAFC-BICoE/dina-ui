import { SUPER_USER, USER } from "common-ui/types/DinaRoles";
import DinaUserDetailsPage from "../../../pages/dina-user/view";
import {
  mountWithAppContext,
  mountWithAppContext
} from "../../../test-util/mock-app-context";
import { Person } from "../../../types/objectstore-api";
import { DinaUser } from "../../../types/user-api/resources/DinaUser";
import GroupDetailsPage from "../../../pages/group/view";
import { waitFor } from "@testing-library/react";
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

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: {
      id: "cnc",
      type: "group-membership",
      managedBy: [
        {
          username: "cnc-su",
          agentId: "ba05d46b-6c75-4c92-82d6-e72237d9982f"
        }
      ]
    }
  };
});

const mockBulkGet = jest.fn(async (paths) => {
  return paths.map((path) => {
    if (path.startsWith("person")) {
      return null;
    }
    console.error("No mocked bulkGet response: ", paths);
  });
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

// Pretend we are at the page for index set id#100
jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "2b4549e9-9a95-489f-8e30-74c2d877d8a8" } })
}));

// Mock API requests:
const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet
};

describe("Group view page", () => {
  it("Render the group details", async () => {
    const wrapper = mountWithAppContext(<GroupDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockBulkGet).toHaveBeenCalledTimes(1));
    const reactTable = await wrapper.findByTestId("ReactTable");
    expect(reactTable).toBeInTheDocument();
    expect(wrapper.queryByText("Managed By")).toBeInTheDocument();
    expect(wrapper.queryByText("Associated Agent")).toBeInTheDocument();
    expect(wrapper.queryByText("cnc-su")).toBeInTheDocument();
  });
});
