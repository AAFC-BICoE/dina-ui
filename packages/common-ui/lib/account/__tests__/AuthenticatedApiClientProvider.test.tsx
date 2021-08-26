import { mount } from "enzyme";
import { noop } from "lodash";
import { getIntlSupport } from "../../intl/IntlSupport";
import { ApiClientProvider } from "../../api-client/ApiClientContext";
import { AccountContextI, AccountProvider } from "../AccountProvider";
import { AuthenticatedApiClientProvider } from "../AuthenticatedApiClientProvider";
import { COMMON_UI_MESSAGES_ENGLISH } from "../../intl/common-ui-en";
import { COMMON_UI_MESSAGES_FR } from "../../intl/common-ui-fr";

const mockInterceptorUse = jest.fn();
const apiContext: any = {
  apiClient: {
    axios: {
      interceptors: {
        request: {
          use: mockInterceptorUse
        },
        response: {
          use: mockInterceptorUse
        }
      }
    }
  }
};

const en = { ...COMMON_UI_MESSAGES_ENGLISH };
const fr = { ...COMMON_UI_MESSAGES_FR };
const { IntlProvider } = getIntlSupport({
  defaultMessages: en,
  translations: { en, fr }
});

describe("AuthenticatedApiClientProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders children only when authenticated", () => {
    const wrapper = mount(
      <IntlProvider>
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
      </IntlProvider>
    );

    expect(wrapper.find("div.test-child").exists()).toEqual(true);
  });

  it("Calls the login function when the identity provider is initialized but not authenticated", () => {
    const mockLogin = jest.fn();

    mount(
      <IntlProvider>
        <AccountProvider
          value={{
            ...MOCK_ACCOUNT_CONTEXT,
            authenticated: false,
            initialized: true,
            login: mockLogin
          }}
        >
          <ApiClientProvider value={apiContext}>
            <AuthenticatedApiClientProvider>
              <div className="test-child" />
            </AuthenticatedApiClientProvider>
          </ApiClientProvider>
        </AccountProvider>
      </IntlProvider>
    );

    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it("Adds the bearer header to axios requests.", () => {
    mount(
      <IntlProvider>
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
      </IntlProvider>
    );

    expect(mockInterceptorUse).toHaveBeenCalledTimes(2);
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
