import { mount } from "enzyme";
import { noop } from "lodash";
import { ApiClientProvider } from "../../api-client/ApiClientContext";
import { useQuery } from "../../api-client/useQuery";
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

  it("Adds the bearer header to axios requests.", () => {
    // Performs a useQuery when component is mounted.
    const QueryCallComponent = () => {
      useQuery({ path: `user-api/user/6b3c3231-09f5-4276-9e55-76eae476905f` });

      return <></>;
    };

    mount(
      <AccountProvider
        value={{
          ...MOCK_ACCOUNT_CONTEXT,
          authenticated: true,
          initialized: true,
          getCurrentToken: () => Promise.resolve("Mat's-test-token")
        }}
      >
        <ApiClientProvider value={apiContext}>
          <AuthenticatedApiClientProvider>
            <QueryCallComponent />
          </AuthenticatedApiClientProvider>
        </ApiClientProvider>
      </AccountProvider>
    );

    expect(mockInterceptorUse).toHaveBeenCalledTimes(1);
    expect(mockInterceptorUse.mock.calls[0][0]({ headers: {} })).toEqual(
      Promise.resolve("Mat's-test-token")
    );
  });
});

const MOCK_ACCOUNT_CONTEXT: AccountContextI = {
  authenticated: true,
  initialized: true,
  login: noop,
  logout: noop,
  roles: ["user"],
  // Mock for a successful token update.
  getCurrentToken: () => Promise.resolve("test-token"),
  username: "test-user"
};
