import {
  ApiClientContext,
  ApiClientContextI,
  COMMON_UI_MESSAGES_ENGLISH,
  COMMON_UI_MESSAGES_FR,
  createContextValue,
  getIntlSupport
} from "common-ui";
import { mount } from "enzyme";

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
  const { IntlProvider } = getIntlSupport({
    defaultMessages: COMMON_UI_MESSAGES_ENGLISH,
    translations: {
      en: COMMON_UI_MESSAGES_ENGLISH,
      fr: COMMON_UI_MESSAGES_FR
    }
  });

  return (
    <ApiClientContext.Provider value={apiContext || createContextValue()}>
      <IntlProvider>{children}</IntlProvider>
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
