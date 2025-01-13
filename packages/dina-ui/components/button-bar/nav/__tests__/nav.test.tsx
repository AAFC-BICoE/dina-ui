import "@testing-library/jest-dom";
import { fireEvent } from "@testing-library/react";
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
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("Shows neither the login or logout button when the account context is not initialized.", () => {
    const wrapper = mountWithAppContext(<Nav />, {
      accountContext: { initialized: false }
    });

    expect(wrapper.queryByText("Login")).toBeNull();
    expect(wrapper.queryByText("Logout")).toBeNull();
  });
});
