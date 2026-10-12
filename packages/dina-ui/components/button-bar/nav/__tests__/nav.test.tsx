import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { mountWithAppContext } from "common-ui";
import { Nav } from "../nav";

describe("Nav component", () => {
  it("Shows the logout button when logged in.", async () => {
    const mockLogout = jest.fn();
    const component = mountWithAppContext(<Nav />, {
      accountContext: { authenticated: true, logout: mockLogout }
    });

    const logoutButton = await component.findByText("Logout");

    // Click the logout button:
    await userEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("Shows neither the login or logout button when the account context is not initialized.", () => {
    const wrapper = mountWithAppContext(<Nav />, {
      accountContext: { initialized: false }
    });

    expect(wrapper.queryByText("Login")).toBeNull();
    expect(wrapper.queryByText("Logout")).toBeNull();
  });

  it("Links to the Controlled Vocabulary page from the Controlled Vocabulary menu.", async () => {
    const wrapper = mountWithAppContext(<Nav />, {
      accountContext: { authenticated: true, roles: [] }
    });

    await userEvent.hover(
      wrapper.getByRole("button", { name: "Controlled Vocabulary" })
    );

    // The dropdown itself is also a "Controlled Vocabulary" menuitem, so find the link by href:
    const links = wrapper
      .getAllByRole("menuitem", { name: "Controlled Vocabulary" })
      .map((item) => item.getAttribute("href"));
    expect(links).toContain("/controlled-vocabulary/list");
    expect(
      wrapper.queryByRole("menuitem", { name: "Managed Attributes" })
    ).toBeNull();
  });
});
