import {
  AccountContextI,
  AccountProvider,
  ApiClientI,
  ApiClientImpl,
  ApiClientProvider,
  ModalProvider
} from "common-ui";
import { mount } from "enzyme";
import { merge, noop } from "lodash";
import { useRef } from "react";
import { DndProvider } from "react-dnd-cjs";
import HTML5Backend from "react-dnd-html5-backend-cjs";
import { PartialDeep } from "type-fest";
import { FileUploadProviderImpl } from "../components/object-store/file-upload/FileUploadProvider";
import { DinaIntlProvider } from "../intl/dina-ui-intl";

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
  apiContext,
  children
}: MockAppContextProviderProps) {
  const apiContextWithWarnings = {
    ...apiContext,
    // Add a warning when bulkGet doesn't return anything in a test:
    bulkGet: async (paths: string[]) => {
      const resources = await apiContext?.bulkGet?.(paths);
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
    <AccountProvider
      value={{ ...DEFAULT_MOCK_ACCOUNT_CONTEXT, ...accountContext }}
    >
      <ApiClientProvider
        value={merge({}, DEFAULT_API_CONTEXT_VALUE, apiContextWithWarnings)}
      >
        <FileUploadProviderImpl>
          <DinaIntlProvider>
            <DndProvider backend={HTML5Backend}>
              <div ref={modalWrapperRef}>
                <ModalProvider appElement={modalWrapperRef.current}>
                  {children}
                </ModalProvider>{" "}
              </div>
            </DndProvider>
          </DinaIntlProvider>
        </FileUploadProviderImpl>
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
