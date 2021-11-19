import { mount } from "enzyme";
import { merge, noop } from "lodash";
import { useMemo, useRef } from "react";
import { SWRConfig } from "swr";
import { PartialDeep } from "type-fest";
import { AccountContextI, AccountProvider } from "../account/AccountProvider";
import {
  ApiClientI,
  ApiClientImpl,
  ApiClientProvider
} from "../api-client/ApiClientContext";
import { CommonUIIntlProvider } from "../intl/common-ui-intl";
import { ModalProvider } from "../modal/modal";

interface MockAppContextProviderProps {
  apiContext?: PartialDeep<ApiClientI>;
  accountContext?: Partial<AccountContextI>;
  children?: React.ReactNode;
}

/**
 * Wraps a test-rendered component to provide the contexts that would be available in
 * the application.
 */
export function MockAppContextProvider({
  accountContext,
  apiContext = { apiClient: { get: () => undefined as any } },
  children
}: MockAppContextProviderProps) {
  const DEFAULT_MOCK_ACCOUNT_CONTEXT: AccountContextI = useMemo(
    () => ({
      authenticated: true,
      groupNames: ["aafc", "cnc"],
      initialized: true,
      login: noop,
      logout: noop,
      roles: ["user"],
      token: "test-token",
      username: "test-user",
      isAdmin: false
    }),
    []
  );

  const DEFAULT_API_CONTEXT_VALUE = useMemo(
    () =>
      new ApiClientImpl({
        newId: () => "00000000-0000-0000-0000-000000000000"
      }),
    []
  );

  const apiContextWithWarnings = {
    ...apiContext,
    // Add a warning when bulkGet doesn't return anything in a test:
    bulkGet: async (paths: string[], options) => {
      const resources = await apiContext?.bulkGet?.(paths, options);
      if (!resources) {
        console.warn("No response returned for bulkGet paths: ", paths);
      } else {
        resources.forEach((resource, index) => {
          if (!resource) {
            console.warn("No value returned for bulkGet path: ", paths[index]);
          }
        });
      }
      return resources;
    }
  };

  const modalWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <SWRConfig
      // Reset SWR cache between tests.
      value={{ provider: () => new Map() }}
    >
      <AccountProvider
        value={{ ...DEFAULT_MOCK_ACCOUNT_CONTEXT, ...accountContext }}
      >
        <ApiClientProvider
          value={merge({}, DEFAULT_API_CONTEXT_VALUE, apiContextWithWarnings)}
        >
          <CommonUIIntlProvider>
            <div ref={modalWrapperRef}>
              <ModalProvider appElement={modalWrapperRef.current}>
                {children}
              </ModalProvider>
            </div>
          </CommonUIIntlProvider>
        </ApiClientProvider>
      </AccountProvider>
    </SWRConfig>
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
