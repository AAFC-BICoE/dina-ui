import { ApiClientContext, createContextValue } from "common-ui";
import App from "next/app";
import React from "react";
import "react-datepicker/dist/react-datepicker.css";
import "react-table/react-table.css";
import "react-tabs/style/react-tabs.css";
import { SeqdbIntlProvider } from "../intl/seqdb-intl";

/**
 * App component that wraps every page component.
 *
 * See: https://github.com/zeit/next.js/#custom-app
 */
export default class SeqdbUiApp extends App {
  private contextValue = createContextValue();

  public render() {
    const { Component, pageProps } = this.props;

    return (
      <ApiClientContext.Provider value={this.contextValue}>
        <SeqdbIntlProvider>
          <Component {...pageProps} />
        </SeqdbIntlProvider>
      </ApiClientContext.Provider>
    );
  }
}
