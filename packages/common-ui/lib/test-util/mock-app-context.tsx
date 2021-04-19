import { mount } from "enzyme";
import { merge, noop } from "lodash";
import { AccountContextI, AccountProvider } from "../account/AccountProvider";
import {
  ApiClientI,
  ApiClientImpl,
  ApiClientProvider
} from "../api-client/ApiClientContext";
import { CommonUIIntlProvider } from "../intl/common-ui-intl";
import { ModalProvider } from "../modal/modal";

interface MockAppContextProviderProps {
  apiContext?: ApiClientI;
  accountContext?: Partial<AccountContextI>;
  children?: React.ReactNode;
}

/**
 * Wraps a test-rendered component to provide the contexts that would be available in
 * the application.
 */
export function MockAppContextProvider({
  accountContext,
  apiContext,
  children
}: MockAppContextProviderProps) {
  return (
    <AccountProvider
      value={{ ...DEFAULT_MOCK_ACCOUNT_CONTEXT, ...accountContext }}
    >
      <ApiClientProvider
        value={merge({}, DEFAULT_API_CONTEXT_VALUE, apiContext)}
      >
        <CommonUIIntlProvider>
          <ModalProvider appElement={document.querySelector("body")}>
            {children}
          </ModalProvider>
        </CommonUIIntlProvider>
      </ApiClientProvider>
    </AccountProvider>
  );
}

/**
 * Helper function to get a test wrapper with the required context providers.
 */
export function mountWithAppContext(
  element: React.ReactNode,
  mockAppContextProviderProps?: MockAppContextProviderProps
) {
  return mount(
    <MockAppContextProvider {...mockAppContextProviderProps}>
      {element}
    </MockAppContextProvider>
  );
}

const DEFAULT_MOCK_ACCOUNT_CONTEXT: AccountContextI = {
  authenticated: true,
  groupNames: ["aafc", "cnc"],
  initialized: true,
  login: noop,
  logout: noop,
  roles: ["user"],
  token: "test-token",
  username: "test-user"
};

const DEFAULT_API_CONTEXT_VALUE = new ApiClientImpl({
  newId: () => "00000000-0000-0000-0000-000000000000"
});
