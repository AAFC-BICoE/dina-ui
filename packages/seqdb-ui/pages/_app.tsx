import "bootswatch/dist/spacelab/bootstrap.min.css";
import {
  AuthenticatedApiClientProvider,
  createContextValue,
  KeycloakAccountProvider
} from "common-ui";
import "common-ui/lib/button-bar/buttonbar.css";
import App from "next/app";
import React from "react";
import "react-datepicker/dist/react-datepicker.css";
import "react-table/react-table.css";
import "react-tabs/style/react-tabs.css";
import "../components/button-bar/buttonbar.css";
import "../components/nav/nav.css";
import { SeqdbIntlProvider } from "../intl/seqdb-intl";

/**
 * App component that wraps every page component.
 *
 * See: https://github.com/zeit/next.js/#custom-app
 */
export default class SeqdbUiApp extends App {
  private contextValue = createContextValue({
    baseURL: "/api"
  });

  public render() {
    const { Component, pageProps } = this.props;

    return (
      <KeycloakAccountProvider>
        <AuthenticatedApiClientProvider apiContext={this.contextValue}>
          <SeqdbIntlProvider>
            <Component {...pageProps} />
          </SeqdbIntlProvider>
        </AuthenticatedApiClientProvider>
      </KeycloakAccountProvider>
    );
  }
}
