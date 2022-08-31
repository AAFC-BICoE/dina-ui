import { mount } from "enzyme";
import { noop } from "lodash";
import { ApiClientProvider } from "../../api-client/ApiClientContext";
import { AccountContextI, AccountProvider } from "../AccountProvider";
import { AuthenticatedApiClientProvider } from "../AuthenticatedApiClientProvider";

const mockInterceptorUse = jest.fn();
const apiContext: any = {
  apiClient: {
    axios: {
      interceptors: {
        request: {
          use: mockInterceptorUse
        }
      }
    }
  }
};

describe("AuthenticatedApiClientProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders children only when authenticated", () => {
    const wrapper = mount(
      <AccountProvider
        value={{
          ...MOCK_ACCOUNT_CONTEXT,
          authenticated: true,
          initialized: true
        }}
      >
        <ApiClientProvider value={apiContext}>
          <AuthenticatedApiClientProvider>
            <div className="test-child" />
          </AuthenticatedApiClientProvider>
        </ApiClientProvider>
      </AccountProvider>
    );

    expect(wrapper.find("div.test-child").exists()).toEqual(true);
  });

  it("Adds the bearer header to axios requests.", () => {
    mount(
      <AccountProvider
        value={{
          ...MOCK_ACCOUNT_CONTEXT,
          authenticated: true,
          initialized: true,
          token: "Mat's-test-token"
        }}
      >
        <ApiClientProvider value={apiContext}>
          <AuthenticatedApiClientProvider>
            <div className="test-child" />
          </AuthenticatedApiClientProvider>
        </ApiClientProvider>
      </AccountProvider>
    );

    expect(mockInterceptorUse).toHaveBeenCalledTimes(1);
    expect(mockInterceptorUse.mock.calls[0][0]({ headers: {} })).toEqual({
      headers: { Authorization: "Bearer Mat's-test-token" }
    });
  });
});

const MOCK_ACCOUNT_CONTEXT: AccountContextI = {
  authenticated: true,
  initialized: true,
  login: noop,
  logout: noop,
  roles: ["user"],
  token: "test-token",
  username: "test-user"
};
