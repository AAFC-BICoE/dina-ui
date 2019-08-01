import App, { Container } from "next/app";
import React from "react";
import { ApiClientContext, createContextValue } from "../components";

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
        <Container>
          <Component {...pageProps} />
        </Container>
      </ApiClientContext.Provider>
    );
  }
}
