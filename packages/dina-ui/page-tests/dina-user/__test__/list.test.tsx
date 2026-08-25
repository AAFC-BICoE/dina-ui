import { waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clearAndType, mountWithAppContext } from "common-ui";
import { DINA_ADMIN, GUEST, SUPER_USER } from "common-ui/types/DinaRoles";
import DinaUserListPage from "../../../pages/dina-user/list";
import { Person } from "../../../types/objectstore-api";
import "@testing-library/jest-dom";

// Mock next/link to render a plain anchor so the link targets can be asserted
jest.mock("next/link", () => {
  const ReactActual = jest.requireActual("react");
  return ({ children, href }) =>
    ReactActual.isValidElement(children)
      ? ReactActual.cloneElement(children, { href })
      : ReactActual.createElement("a", { href }, children);
});

jest.mock("next/router", () => ({
  useRouter: () => ({ query: {}, pathname: "/dina-user/list", push: jest.fn() })
}));

const TEST_AGENT: Person = {
  id: "agent-1",
  type: "person",
  displayName: "Alice Agent",
  email: "alice@agent.com",
  uuid: "agent-1"
};

const TEST_USERS = [
  {
    id: "1",
    type: "user",
    username: "alice",
    firstName: "Alice",
    lastName: "Arnold",
    emailAddress: "alice@example.com",
    agentId: "agent-1",
    rolesPerGroup: { aafc: [SUPER_USER] },
    adminRoles: []
  },
  {
    id: "2",
    type: "user",
    username: "bob",
    firstName: "Bob",
    lastName: "Byrne",
    emailAddress: "bob@example.com",
    rolesPerGroup: { cnc: [GUEST] },
    adminRoles: [DINA_ADMIN]
  },
  {
    // Regression test: a user with no rolesPerGroup should not crash the page.
    id: "3",
    type: "user",
    username: "legacy-user",
    adminRoles: []
  }
];

const TEST_GROUPS = [
  {
    id: "g1",
    type: "group",
    name: "aafc",
    path: "/aafc",
    labels: { en: "AAFC" }
  },
  {
    id: "g2",
    type: "group",
    name: "cnc",
    path: "/cnc",
    labels: { en: "CNC" }
  }
];

/**
 * Whether the mocked User API advertises server-side filtering (meta.serverSideFiltering).
 * The mock never applies the fiql it receives, so in server-side mode the rows displayed are
 * exactly what the "server" returned, which shows that nothing is filtered client-side.
 */
let serverSideFiltering = false;

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (path: string, params?: any) => {
  if (path === "user-api/user") {
    return { data: TEST_USERS, meta: { totalResourceCount: TEST_USERS.length } };
  }
  if (path === "user-api/group") {
    // GroupLabel and GroupSelectField filter groups by (comma-separated) names:
    const names: string[] | undefined = params?.filter?.name
      ?.split(",")
      .map((name: string) => name.trim().toLowerCase());
    const groups = names?.length
      ? TEST_GROUPS.filter((group) => names.includes(group.name))
      : TEST_GROUPS;
    return {
      data: groups,
      meta: {
        totalResourceCount: groups.length,
        ...(serverSideFiltering && { serverSideFiltering: true })
      }
    };
  }
  return { data: [] };
});

const mockBulkGet = jest.fn(async (paths: string[]) =>
  paths.map((path) => {
    if (path === "person/agent-1") {
      return TEST_AGENT;
    }
    return null;
  })
);

const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet
};

/* Opens a react-select dropdown inside the given field wrapper and clicks an option. */
async function selectOption(
  wrapper: ReturnType<typeof mountWithAppContext>,
  fieldClassName: string,
  optionName: RegExp | string
) {
  const field = wrapper.container.querySelector(fieldClassName) as HTMLElement;
  await userEvent.click(within(field).getByRole("combobox"));
  await waitFor(() => {
    expect(
      wrapper.getByRole("option", { name: optionName })
    ).toBeInTheDocument();
  });
  await userEvent.click(wrapper.getByRole("option", { name: optionName }));
}

describe("Dina user list page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("Renders the users with their user, agent and roles columns.", async () => {
    const wrapper = mountWithAppContext(<DinaUserListPage />, { apiContext });

    await waitFor(() => {
      expect(wrapper.getByText("alice")).toBeInTheDocument();
      expect(wrapper.getByText("bob")).toBeInTheDocument();
      // The user with no rolesPerGroup renders without crashing:
      expect(wrapper.getByText("legacy-user")).toBeInTheDocument();
    });

    // The username links to the user view page
    expect(wrapper.getByRole("link", { name: "alice" })).toHaveAttribute(
      "href",
      "/dina-user/view?id=1"
    );

    // The client-side joined agent links to the person view page
    expect(wrapper.getByRole("link", { name: "Alice Agent" })).toHaveAttribute(
      "href",
      "/person/view?id=agent-1"
    );

    // The name column shows the full name
    expect(wrapper.getByText("Alice Arnold")).toBeInTheDocument();
    expect(wrapper.getByText("Bob Byrne")).toBeInTheDocument();

    // The email column is displayed as a mailto link
    expect(
      wrapper.getByRole("link", { name: "alice@example.com" })
    ).toHaveAttribute("href", "mailto:alice@example.com");

    // The search input explains what can be searched
    expect(
      wrapper.getByPlaceholderText("Search by username, name, email or agent")
    ).toBeInTheDocument();

    // The roles-per-group table shows each group's label (linked to the
    // group view page) with the user's roles in that group
    await waitFor(() => {
      expect(wrapper.getByRole("link", { name: "AAFC" })).toHaveAttribute(
        "href",
        "/group/view?id=g1"
      );
      expect(wrapper.getByRole("link", { name: "CNC" })).toHaveAttribute(
        "href",
        "/group/view?id=g2"
      );
    });
    expect(wrapper.getByText("super-user")).toBeInTheDocument();
    expect(wrapper.getByText("guest")).toBeInTheDocument();

    // Realm-level admin roles are displayed as badges
    expect(wrapper.getByText("dina-admin")).toBeInTheDocument();

    // The full list is loaded once for in-memory filtering,
    // without a fiql param (which the User API ignores)
    expect(mockGet).toHaveBeenCalledWith(
      "user-api/user",
      expect.objectContaining({ page: { limit: 1000, offset: 0 } })
    );
    expect(mockGet).toHaveBeenCalledWith(
      "user-api/user",
      expect.not.objectContaining({ fiql: expect.anything() })
    );
  });

  it("Filters the users with the free-text search.", async () => {
    const wrapper = mountWithAppContext(<DinaUserListPage />, { apiContext });

    await waitFor(() => {
      expect(wrapper.getByText("bob")).toBeInTheDocument();
    });

    // Search by last name (not a displayed column but still searchable)
    await clearAndType(
      wrapper.getByRole("textbox", { name: /filter value/i }),
      "arnold"
    );
    await userEvent.click(
      wrapper.getByRole("button", { name: /filter list/i })
    );

    await waitFor(() => {
      expect(wrapper.getByText("alice")).toBeInTheDocument();
      expect(wrapper.queryByText("bob")).not.toBeInTheDocument();
      expect(wrapper.queryByText("legacy-user")).not.toBeInTheDocument();
    });

    // Search by the joined agent's display name
    await clearAndType(
      wrapper.getByRole("textbox", { name: /filter value/i }),
      "alice agent"
    );
    await userEvent.click(
      wrapper.getByRole("button", { name: /filter list/i })
    );

    await waitFor(() => {
      expect(wrapper.getByText("alice")).toBeInTheDocument();
      expect(wrapper.queryByText("bob")).not.toBeInTheDocument();
    });

    // Reset the filters; all users should be shown again
    await userEvent.click(
      wrapper.getByRole("button", { name: /reset filters/i })
    );
    await waitFor(() => {
      expect(wrapper.getByText("alice")).toBeInTheDocument();
      expect(wrapper.getByText("bob")).toBeInTheDocument();
      expect(wrapper.getByText("legacy-user")).toBeInTheDocument();
    });
  });

  it("Filters the users by group.", async () => {
    const wrapper = mountWithAppContext(<DinaUserListPage />, { apiContext });

    await waitFor(() => {
      expect(wrapper.getByText("bob")).toBeInTheDocument();
    });

    // Select the AAFC group; only alice is a member
    await selectOption(wrapper, ".group-field", "AAFC");

    await waitFor(() => {
      expect(wrapper.getByText("alice")).toBeInTheDocument();
      expect(wrapper.queryByText("bob")).not.toBeInTheDocument();
      expect(wrapper.queryByText("legacy-user")).not.toBeInTheDocument();
    });
  });

  it("Filters the users by role.", async () => {
    const wrapper = mountWithAppContext(<DinaUserListPage />, { apiContext });

    await waitFor(() => {
      expect(wrapper.getByText("alice")).toBeInTheDocument();
    });

    // super-user is a group-based role: with no group selected it matches
    // the role in any of the user's groups
    await selectOption(wrapper, ".role-field", "super-user");

    await waitFor(() => {
      expect(wrapper.getByText("alice")).toBeInTheDocument();
      expect(wrapper.queryByText("bob")).not.toBeInTheDocument();
      expect(wrapper.queryByText("legacy-user")).not.toBeInTheDocument();
    });

    // dina-admin is an admin-based role stored in adminRoles
    await selectOption(wrapper, ".role-field", "dina-admin");

    await waitFor(() => {
      expect(wrapper.getByText("bob")).toBeInTheDocument();
      expect(wrapper.queryByText("alice")).not.toBeInTheDocument();
    });
  });

  it("Combines the group and role filters.", async () => {
    const wrapper = mountWithAppContext(<DinaUserListPage />, { apiContext });

    await waitFor(() => {
      expect(wrapper.getByText("bob")).toBeInTheDocument();
    });

    // bob is in cnc but only as a guest, so cnc + super-user matches nobody
    await selectOption(wrapper, ".group-field", "CNC");
    await selectOption(wrapper, ".role-field", "super-user");

    await waitFor(() => {
      expect(wrapper.queryByText("bob")).not.toBeInTheDocument();
      expect(wrapper.getByText(/no rows found/i)).toBeInTheDocument();
    });
  });

  it("Filters the users by whether they are linked to an agent.", async () => {
    const wrapper = mountWithAppContext(<DinaUserListPage />, { apiContext });

    await waitFor(() => {
      expect(wrapper.getByText("bob")).toBeInTheDocument();
    });

    // Only alice has an agentId:
    await selectOption(wrapper, ".agentLink-field", /^linked$/i);

    await waitFor(() => {
      expect(wrapper.getByText("alice")).toBeInTheDocument();
      expect(wrapper.queryByText("bob")).not.toBeInTheDocument();
      expect(wrapper.queryByText("legacy-user")).not.toBeInTheDocument();
    });

    await selectOption(wrapper, ".agentLink-field", /^unlinked$/i);

    await waitFor(() => {
      expect(wrapper.getByText("bob")).toBeInTheDocument();
      expect(wrapper.getByText("legacy-user")).toBeInTheDocument();
      expect(wrapper.queryByText("alice")).not.toBeInTheDocument();
    });
  });

  it("Searches as the user types and shows how many users were filtered out.", async () => {
    const wrapper = mountWithAppContext(<DinaUserListPage />, { apiContext });

    await waitFor(() => {
      expect(wrapper.getByText("bob")).toBeInTheDocument();
    });

    // Search by last name without clicking the filter button,
    // the list is re-filtered after the (debounced) typing
    await clearAndType(
      wrapper.getByRole("textbox", { name: /filter value/i }),
      "byrne"
    );

    await waitFor(() => {
      expect(wrapper.getByText("bob")).toBeInTheDocument();
      expect(wrapper.queryByText("alice")).not.toBeInTheDocument();
      expect(wrapper.queryByText("legacy-user")).not.toBeInTheDocument();
    });

    // The counts (shown above and below the table) tell a filtered list apart from a short one
    expect(
      wrapper.getAllByText("Total matched records: 1")[0]
    ).toBeInTheDocument();
    expect(
      wrapper.getAllByText(/filtered from 3 total/i)[0]
    ).toBeInTheDocument();
  });
});

describe("Dina user list page with a User API that filters server-side", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    serverSideFiltering = true;
  });

  afterEach(() => {
    serverSideFiltering = false;
  });

  it("Requests one sorted page and sends the free-text search as fiql instead of filtering in-memory.", async () => {
    const wrapper = mountWithAppContext(<DinaUserListPage />, { apiContext });

    await waitFor(() => {
      expect(wrapper.getByText("bob")).toBeInTheDocument();
    });

    // A single table page is requested, sorted by the server, instead of the whole list
    expect(mockGet).toHaveBeenCalledWith(
      "user-api/user",
      expect.objectContaining({
        page: { limit: 25, offset: 0 },
        sort: "username"
      })
    );
    expect(mockGet).not.toHaveBeenCalledWith(
      "user-api/user",
      expect.objectContaining({ page: { limit: 1000, offset: 0 } })
    );

    // The agent is joined client-side, so it can't be searched server-side
    expect(
      wrapper.getByPlaceholderText("Search by username, name or email")
    ).toBeInTheDocument();

    await clearAndType(
      wrapper.getByRole("textbox", { name: /filter value/i }),
      "arnold"
    );
    await userEvent.click(
      wrapper.getByRole("button", { name: /filter list/i })
    );

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        "user-api/user",
        expect.objectContaining({
          fiql: "username==*arnold*,firstName==*arnold*,lastName==*arnold*,emailAddress==*arnold*"
        })
      );
    });

    // The rows are what the server returned (the mock ignores the fiql)
    // nothing is filtered out client-side, and there is no "filtered from" count.
    expect(wrapper.getByText("alice")).toBeInTheDocument();
    expect(wrapper.getByText("bob")).toBeInTheDocument();
    expect(wrapper.getByText("legacy-user")).toBeInTheDocument();
    expect(wrapper.queryByText(/filtered from/i)).not.toBeInTheDocument();
  });

  it("Sends the group, role and agent-link filters as fiql.", async () => {
    const wrapper = mountWithAppContext(<DinaUserListPage />, { apiContext });

    await waitFor(() => {
      expect(wrapper.getByText("bob")).toBeInTheDocument();
    });

    // A group-based role with no group selected is searched across all the known groups
    await selectOption(wrapper, ".role-field", "super-user");
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        "user-api/user",
        expect.objectContaining({
          fiql: "(rolesPerGroup.aafc==super-user,rolesPerGroup.cnc==super-user)"
        })
      );
    });

    // Within the selected group
    await selectOption(wrapper, ".group-field", "CNC");
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        "user-api/user",
        expect.objectContaining({ fiql: "rolesPerGroup.cnc==super-user" })
      );
    });

    // Admin-based roles are stored in adminRoles; the group is then a membership check.
    // The agent link is based on the agentId
    await selectOption(wrapper, ".role-field", "dina-admin");
    await selectOption(wrapper, ".agentLink-field", /^unlinked$/i);
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        "user-api/user",
        expect.objectContaining({
          fiql: "adminRoles==dina-admin;rolesPerGroup.cnc!=null;agentId==null"
        })
      );
    });
  });
});
