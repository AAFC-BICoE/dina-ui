import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Nav } from "../nav";

describe("Nav component", () => {
  it("Shows the logout button when logged in.", () => {
    const mockLogout = jest.fn();
    const wrapper = mountWithAppContext(<Nav />, {
      accountContext: { authenticated: true, logout: mockLogout }
    });

    const logoutButton = wrapper.find("button.logout-button");

    // Click the logout button:
    logoutButton.simulate("click");
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("Shows neither the login or logout button when the account context is not initialized.", () => {
    const wrapper = mountWithAppContext(<Nav />, {
      accountContext: { initialized: false }
    });

    expect(wrapper.find("button.logout-button").exists()).toEqual(false);
  });
});
