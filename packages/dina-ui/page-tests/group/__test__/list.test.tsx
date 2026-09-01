import { waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clearAndType, mountWithAppContext } from "common-ui";
import { GUEST, SUPER_USER } from "common-ui/types/DinaRoles";
import GroupListPage from "../../../pages/group/list";
import { Group } from "../../../types/user-api";
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
  useRouter: () => ({ query: {}, pathname: "/group/list", push: jest.fn() })
}));

const TEST_GROUPS: Group[] = [
  {
    id: "1",
    type: "group",
    name: "aafc",
    path: "/aafc",
    labels: { en: "AAFC", fr: "ASC" },
    roles: []
  },
  {
    id: "2",
    type: "group",
    name: "cnc",
    path: "/cnc",
    labels: { en: "CNC" },
    roles: []
  },
  {
    // The current user is not a member of this group, and it has no label
    id: "3",
    type: "group",
    name: "unlabelled",
    path: "/unlabelled",
    labels: {},
    roles: []
  }
];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (path: string) => {
  if (path === "user-api/group") {
    return {
      data: TEST_GROUPS,
      meta: { totalResourceCount: TEST_GROUPS.length }
    };
  }
  return { data: [] };
});

const apiContext: any = {
  apiClient: { get: mockGet }
};

/** The signed-in user belongs to aafc (as super-user) and cnc (as guest). */
const accountContext = {
  groupNames: ["aafc", "cnc"],
  rolesPerGroup: { aafc: [SUPER_USER], cnc: [GUEST] }
};

/** Opens a react-select dropdown inside the given field wrapper and clicks an option. */
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

describe("Group list page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("Renders the groups with their localized label and the user's roles.", async () => {
    const wrapper = mountWithAppContext(<GroupListPage />, {
      apiContext,
      accountContext
    });

    await waitFor(() => {
      expect(wrapper.getByText("aafc")).toBeInTheDocument();
      expect(wrapper.getByText("cnc")).toBeInTheDocument();
    });

    // The group's short identifier is labelled "Group Code"
    expect(wrapper.getByText("Group Code")).toBeInTheDocument();

    // The group code links to the group view page
    expect(wrapper.getByRole("link", { name: "aafc" })).toHaveAttribute(
      "href",
      "/group/view?id=1"
    );

    // The localized (English) labels and the paths are shown
    expect(wrapper.getByText("AAFC")).toBeInTheDocument();
    expect(wrapper.getByText("CNC")).toBeInTheDocument();
    expect(wrapper.getByText("/aafc")).toBeInTheDocument();

    // The current user's role in each group is shown as a badge
    expect(wrapper.getByText("super-user")).toBeInTheDocument();
    expect(wrapper.getByText("guest")).toBeInTheDocument();

    // The full list is loaded once for in-memory filtering, without a fiql param
    expect(mockGet).toHaveBeenCalledWith(
      "user-api/group",
      expect.objectContaining({ page: { limit: 1000, offset: 0 } })
    );
    expect(mockGet).toHaveBeenCalledWith(
      "user-api/group",
      expect.not.objectContaining({ fiql: expect.anything() })
    );
    // Sorting is in-memory too, so no sort param is sent
    expect(mockGet).not.toHaveBeenCalledWith(
      "user-api/group",
      expect.objectContaining({ sort: expect.anything() })
    );
  });

  it("Filters the groups by name, path and any-language label.", async () => {
    const wrapper = mountWithAppContext(<GroupListPage />, {
      apiContext,
      accountContext
    });

    await waitFor(() => {
      expect(wrapper.getByText("cnc")).toBeInTheDocument();
    });

    // Search by the French label of "aafc"
    await clearAndType(
      wrapper.getByRole("textbox", { name: /filter value/i }),
      "asc"
    );
    await userEvent.click(wrapper.getByRole("button", { name: /filter list/i }));

    await waitFor(() => {
      expect(wrapper.getByText("aafc")).toBeInTheDocument();
      expect(wrapper.queryByText("cnc")).not.toBeInTheDocument();
    });

    // Reset the filter; all groups should be shown again
    await userEvent.click(
      wrapper.getByRole("button", { name: /reset filters/i })
    );

    await waitFor(() => {
      expect(wrapper.getByText("aafc")).toBeInTheDocument();
      expect(wrapper.getByText("cnc")).toBeInTheDocument();
      expect(wrapper.getByText("unlabelled")).toBeInTheDocument();
    });
  });

  it("Filters the groups by the current user's membership.", async () => {
    const wrapper = mountWithAppContext(<GroupListPage />, {
      apiContext,
      accountContext
    });

    await waitFor(() => {
      expect(wrapper.getByText("unlabelled")).toBeInTheDocument();
    });

    await selectOption(wrapper, ".membership-field", /my groups/i);

    await waitFor(() => {
      expect(wrapper.getByText("aafc")).toBeInTheDocument();
      expect(wrapper.getByText("cnc")).toBeInTheDocument();
      expect(wrapper.queryByText("unlabelled")).not.toBeInTheDocument();
    });

    // The inverse selection shows only the groups the user is not a member of
    await selectOption(
      wrapper,
      ".membership-field",
      /other groups/i
    );

    await waitFor(() => {
      expect(wrapper.getByText("unlabelled")).toBeInTheDocument();
      expect(wrapper.queryByText("aafc")).not.toBeInTheDocument();
      expect(wrapper.queryByText("cnc")).not.toBeInTheDocument();
    });
  });

  it("Filters the groups by the current user's role in them.", async () => {
    const wrapper = mountWithAppContext(<GroupListPage />, {
      apiContext,
      accountContext
    });

    await waitFor(() => {
      expect(wrapper.getByText("cnc")).toBeInTheDocument();
    });

    await selectOption(wrapper, ".role-field", "super-user");

    await waitFor(() => {
      expect(wrapper.getByText("aafc")).toBeInTheDocument();
      expect(wrapper.queryByText("cnc")).not.toBeInTheDocument();
      expect(wrapper.queryByText("unlabelled")).not.toBeInTheDocument();
    });
  });

  it("Filters the groups by whether they have a label in the current language.", async () => {
    const wrapper = mountWithAppContext(<GroupListPage />, {
      apiContext,
      accountContext
    });

    await waitFor(() => {
      expect(wrapper.getByText("aafc")).toBeInTheDocument();
    });

    await selectOption(wrapper, ".labelStatus-field", /unlabeled/i);

    await waitFor(() => {
      expect(wrapper.getByText("unlabelled")).toBeInTheDocument();
      expect(wrapper.queryByText("aafc")).not.toBeInTheDocument();
      expect(wrapper.queryByText("cnc")).not.toBeInTheDocument();
    });

    await selectOption(wrapper, ".labelStatus-field", /^labeled$/i);

    await waitFor(() => {
      expect(wrapper.getByText("aafc")).toBeInTheDocument();
      expect(wrapper.getByText("cnc")).toBeInTheDocument();
      expect(wrapper.queryByText("unlabelled")).not.toBeInTheDocument();
    });
  });

  it("Sorts the groups by their localized label.", async () => {
    const wrapper = mountWithAppContext(<GroupListPage />, {
      apiContext,
      accountContext
    });

    await waitFor(() => {
      expect(wrapper.getByText("aafc")).toBeInTheDocument();
    });

    /** The group names in the order the rows are currently displayed. */
    function rowNames() {
      return Array.from(
        wrapper.container.querySelectorAll("tbody tr td:first-child")
      ).map((cell) => cell.textContent);
    }

    // Sort ascending by label; the missing (empty) label sorts first
    await userEvent.click(wrapper.getByText("Label"));
    await waitFor(() => {
      expect(rowNames()).toEqual(["unlabelled", "aafc", "cnc"]);
    });

    // A second click sorts descending
    await userEvent.click(wrapper.getByText("Label"));
    await waitFor(() => {
      expect(rowNames()).toEqual(["cnc", "aafc", "unlabelled"]);
    });
  });

  it("Combines the free-text search with the dropdown filters.", async () => {
    const wrapper = mountWithAppContext(<GroupListPage />, {
      apiContext,
      accountContext
    });

    await waitFor(() => {
      expect(wrapper.getByText("cnc")).toBeInTheDocument();
    });

    // The user is only a guest in cnc, so cnc + super-user matches nothing
    await clearAndType(
      wrapper.getByRole("textbox", { name: /filter value/i }),
      "cnc"
    );
    await userEvent.click(wrapper.getByRole("button", { name: /filter list/i }));
    await selectOption(wrapper, ".role-field", "super-user");

    await waitFor(() => {
      expect(wrapper.queryByText("cnc")).not.toBeInTheDocument();
      expect(wrapper.getByText(/no rows found/i)).toBeInTheDocument();
    });
  });

  it("Shows the create button only to admins.", async () => {
    const nonAdminWrapper = mountWithAppContext(<GroupListPage />, {
      apiContext,
      accountContext
    });
    await waitFor(() => {
      expect(nonAdminWrapper.getByText("aafc")).toBeInTheDocument();
    });
    expect(
      nonAdminWrapper.queryByRole("link", { name: /create new/i })
    ).not.toBeInTheDocument();
    nonAdminWrapper.unmount();

    const adminWrapper = mountWithAppContext(<GroupListPage />, {
      apiContext,
      accountContext: { ...accountContext, isAdmin: true }
    });
    await waitFor(() => {
      expect(
        adminWrapper.getByRole("link", { name: /create new/i })
      ).toBeInTheDocument();
    });
  });

  it("Searches as the user types and shows how many groups were filtered out.", async () => {
    const wrapper = mountWithAppContext(<GroupListPage />, {
      apiContext,
      accountContext
    });

    await waitFor(() => {
      expect(wrapper.getByText("cnc")).toBeInTheDocument();
    });

    // The search input explains what can be searched
    expect(
      wrapper.getByPlaceholderText("Search by code, path or label")
    ).toBeInTheDocument();

    // Search by the French label without clicking the filter button;
    // the list is re-filtered after the (debounced) typing
    await clearAndType(
      wrapper.getByRole("textbox", { name: /filter value/i }),
      "asc"
    );

    await waitFor(() => {
      expect(wrapper.getByText("aafc")).toBeInTheDocument();
      expect(wrapper.queryByText("cnc")).not.toBeInTheDocument();
      expect(wrapper.queryByText("unlabelled")).not.toBeInTheDocument();
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
