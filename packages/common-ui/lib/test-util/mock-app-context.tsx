import { render } from "@testing-library/react";
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
import {
  InstanceContext,
  InstanceContextI,
  InstanceContextProvider
} from "../instance/InstanceContextProvider";
import { CommonUIIntlProvider } from "../intl/common-ui-intl";
import { ModalProvider } from "../modal/modal";

interface MockAppContextProviderProps {
  apiContext?: PartialDeep<ApiClientI>;
  accountContext?: Partial<AccountContextI>;
  instanceContext?: Partial<InstanceContextI>;
  children?: React.ReactNode;
}

/**
 * Wraps a test-rendered component to provide the contexts that would be available in
 * the application.
 */
export function MockAppContextProvider({
  accountContext,
  apiContext = { apiClient: { get: () => undefined as any } },
  instanceContext,
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
      // Mock for a successful token update.
      getCurrentToken: () => Promise.resolve("test-token"),
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

  const DEFAULT_INSTANCE_CONTEXT_VALUE: InstanceContextI = useMemo(
    () => ({
      supportedLanguages: "en,fr",
      instanceMode: "developer",
      instanceName: "AAFC",
      supportedGeographicReferences: "OSM"
    }),
    []
  );

  const apiContextWithWarnings = {
    ...apiContext,
    // Add a warning when bulkGet doesn't return anything in a test:
    bulkGet: async (paths: string[], options) => {
      if (!paths?.length) {
        return [];
      }
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
          <InstanceContextProvider
            value={{ ...DEFAULT_INSTANCE_CONTEXT_VALUE, ...instanceContext }}
          >
            <CommonUIIntlProvider>
              <div ref={modalWrapperRef}>
                <ModalProvider appElement={modalWrapperRef.current}>
                  {children}
                </ModalProvider>
              </div>
            </CommonUIIntlProvider>
          </InstanceContextProvider>
        </ApiClientProvider>
      </AccountProvider>
    </SWRConfig>
  );
}

/**
 * Helper function to get a test wrapper with the required context providers using React-Testing library.
 */
export function mountWithAppContext(
  element: React.ReactNode,
  mockAppContextProviderProps?: MockAppContextProviderProps
) {
  const reactLibraryComponent = render(
    <MockAppContextProvider {...mockAppContextProviderProps}>
      {element}
    </MockAppContextProvider>
  );

  const rerenderWithContext = (elementRerender: React.ReactNode) => {
    reactLibraryComponent.rerender(
      <MockAppContextProvider {...mockAppContextProviderProps}>
        {elementRerender}
      </MockAppContextProvider>
    );
  };

  return {
    ...reactLibraryComponent,
    rerender: rerenderWithContext
  };
}
