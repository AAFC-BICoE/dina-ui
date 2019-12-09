import { mount } from "enzyme";
import {
  ApiClientContext,
  ApiClientContextI,
  createContextValue
} from "../api-client/ApiClientContext";
import { CommonUIIntlProvider } from "../intl/common-ui-intl";

interface MockAppContextProviderProps {
  apiContext?: ApiClientContextI;
  children?: React.ReactNode;
}

/**
 * Wraps a test-rendered component to provide the contexts that would be available in
 * the application.
 */
export function MockAppContextProvider({
  apiContext,
  children
}: MockAppContextProviderProps) {
  return (
    <ApiClientContext.Provider value={apiContext || createContextValue()}>
      <CommonUIIntlProvider>{children}</CommonUIIntlProvider>
    </ApiClientContext.Provider>
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
