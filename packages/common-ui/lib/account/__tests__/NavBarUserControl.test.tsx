import { NavbarUserControl } from "../NavBarUserControl";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { mountWithAppContext } from "common-ui";

describe("NavBarUserControl component", () => {
  it("Shows the logout button when logged in.", async () => {
    const mockLogout = jest.fn();
    const wrapper = mountWithAppContext(<NavbarUserControl />, {
      accountContext: { authenticated: true, logout: mockLogout }
    });

    const logoutButton = wrapper.getByRole("button", { name: /logout/i });

    // Click the logout button:
    await userEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("Shows neither the login or logout button when the account context is not initialized.", () => {
    const wrapper = mountWithAppContext(<NavbarUserControl />, {
      accountContext: { initialized: false }
    });

    // Try to find the button using query method (absence expected)
    const logoutButton = wrapper.queryByRole("button", { name: /logout/i });

    // Expect the button to be null (not found)
    expect(logoutButton).toBeNull();
  });
});
