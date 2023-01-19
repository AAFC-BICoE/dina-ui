import "bootstrap/dist/css/bootstrap.min.css";
import {
  ApiClientImplProvider,
  AuthenticatedApiClientProvider,
  KeycloakAccountProvider,
  ModalProvider
} from "common-ui";
import "common-ui/common-ui-style.scss";
import "common-ui/lib/button-bar/buttonbar.css";
import "common-ui/lib/table/react-table-style.css";
import "../components/object-store/file-upload/file-upload-style.css";
import "handsontable/dist/handsontable.full.min.css";
import { AppProps } from "next/app";
import "rc-pagination/assets/index.css";
import "rc-tooltip/assets/bootstrap.css";
import React from "react";
import "react-datepicker/dist/react-datepicker.css";
import { DndProvider } from "react-dnd-cjs";
import HTML5Backend from "react-dnd-html5-backend-cjs";
import "react-dropzone-uploader/dist/styles.css";
import "react-table/react-table.css";
import "react-tabs/style/react-tabs.css";
import "setimmediate";
import { ErrorBoundaryPage } from "../components";
import "../components/button-bar/nav/app-top.css";
import "../components/button-bar/nav/nav.css";
import "../components/button-bar/nav/wet-beow-bootstrap-4.css";
import "../components/button-bar/nav/wet-beow-override.css";
import "react-awesome-query-builder/lib/css/styles.css";
import { FileUploadProviderImpl } from "../components/object-store/file-upload/FileUploadProvider";
import { DinaIntlProvider } from "../intl/dina-ui-intl";

/**
 * App component that wraps every page component.
 *
 * See: https://github.com/zeit/next.js/#custom-app
 */
export default function DinaUiApp({ Component, pageProps }: AppProps) {
  const appElement = process.browser
    ? document.querySelector<HTMLElement>("#__next")
    : null;

  return (
    <ApiClientImplProvider>
      <KeycloakAccountProvider>
        <AuthenticatedApiClientProvider>
          <DinaIntlProvider>
            <FileUploadProviderImpl>
              <ErrorBoundaryPage>
                <DndProvider backend={HTML5Backend}>
                  <ModalProvider appElement={appElement}>
                    <Component {...pageProps} />
                  </ModalProvider>
                </DndProvider>
              </ErrorBoundaryPage>
            </FileUploadProviderImpl>
          </DinaIntlProvider>
        </AuthenticatedApiClientProvider>
      </KeycloakAccountProvider>
    </ApiClientImplProvider>
  );
}
