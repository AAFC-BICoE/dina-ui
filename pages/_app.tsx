import Kitsu from "kitsu";
import App, { Container } from "next/app";
import React from "react";
import { ApiClientContext } from "../components/api-client/ApiClientContext";

/**
 * App component that wraps every page component.
 *
 * See: https://github.com/zeit/next.js/#custom-app
 */
export default class SeqdbUiApp extends App {
  private apiClient = new Kitsu({
    baseURL: "/api",
    pluralize: false,
    resourceCase: "none"
  });

  public render() {
    const { Component, pageProps } = this.props;

    return (
      <ApiClientContext.Provider value={{ apiClient: this.apiClient }}>
        <Container>
          <Component {...pageProps} />
        </Container>
      </ApiClientContext.Provider>
    );
  }
}
