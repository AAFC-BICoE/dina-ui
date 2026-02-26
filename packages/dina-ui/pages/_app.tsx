import "bootstrap/dist/css/bootstrap.min.css";
import {
  ApiClientImplProvider,
  AuthenticatedApiClientProvider,
  InstanceContextProvider,
  KeycloakAccountProvider,
  DevUserAccountProvider,
  ModalProvider
} from "common-ui";
import "common-ui/common-ui-style.scss";
import "common-ui/lib/button-bar/buttonbar.css";
import "common-ui/lib/table/react-table.css";
import "../components/object-store/file-upload/file-upload-style.css";
import { AppProps } from "next/app";
import "rc-pagination/assets/index.css";
import "rc-tooltip/assets/bootstrap.css";
import React from "react";
import "react-datepicker/dist/react-datepicker.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "react-dropzone-uploader/dist/styles.css";
import "react-tabs/style/react-tabs.css";
import "setimmediate";
import {
  ErrorBoundaryPage,
  WorkbookUploadContextProvider
} from "../components";
import "../components/button-bar/nav/app-top.css";
import "../components/button-bar/nav/nav.css";
import "../components/button-bar/nav/wet-beow-bootstrap-4.css";
import "../components/button-bar/nav/wet-beow-override.css";
import "./bootstrap-print.css";
import "@react-awesome-query-builder/ui/css/styles.css";
import { FileUploadProviderImpl } from "../components/object-store/file-upload/FileUploadProvider";
import { DinaIntlProvider } from "../intl/dina-ui-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
/**
 * App component that wraps every page component.
 *
 * See: https://github.com/zeit/next.js/#custom-app
 */

export default function DinaUiApp({ Component, pageProps }: AppProps) {
  const appElement =
    typeof window !== "undefined"
      ? document.querySelector<HTMLElement>("#__next")
      : null;

  // queryClient for react-query
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5 // 5 minutes
      }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ApiClientImplProvider>
        <InstanceContextProvider>
          <DevUserAccountProvider>
            <KeycloakAccountProvider>
              <AuthenticatedApiClientProvider>
                <DinaIntlProvider>
                  <FileUploadProviderImpl>
                    <ErrorBoundaryPage>
                      <DndProvider backend={HTML5Backend}>
                        <ModalProvider appElement={appElement}>
                          <WorkbookUploadContextProvider>
                            <Component {...pageProps} />
                          </WorkbookUploadContextProvider>
                        </ModalProvider>
                      </DndProvider>
                    </ErrorBoundaryPage>
                  </FileUploadProviderImpl>
                </DinaIntlProvider>
              </AuthenticatedApiClientProvider>
            </KeycloakAccountProvider>
          </DevUserAccountProvider>
        </InstanceContextProvider>
      </ApiClientImplProvider>
    </QueryClientProvider>
  );
}
