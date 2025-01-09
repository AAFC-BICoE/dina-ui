import { NavbarUserControl } from "../NavBarUserControl";
import "@testing-library/jest-dom";
import { fireEvent } from "@testing-library/react";
import { mountWithAppContext } from "../../test-util/mock-app-context";

describe("NavBarUserControl component", () => {
  it("Shows the logout button when logged in.", () => {
    const mockLogout = jest.fn();
    const wrapper = mountWithAppContext(<NavbarUserControl />, {
      accountContext: { authenticated: true, logout: mockLogout }
    });

    const logoutButton = wrapper.getByRole("button", { name: /logout/i });

    // Click the logout button:
    fireEvent.click(logoutButton);
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
