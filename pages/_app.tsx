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

  private hasMounted = false;

  public componentDidMount() {
    this.hasMounted = true;

    // Reload the page after the App is mounted in the browser, because Next.js does not pass in
    // the URL query string on the initial browser-side render.
    // https://github.com/zeit/next.js/issues/2910
    if (!this.isOnErrorPage()) {
      this.props.router.push(this.props.router.asPath);
    }
  }

  public render() {
    const { Component, pageProps } = this.props;

    return (
      // Render nothing on the first browser render to avoid passing an empty query string to
      // the page component.
      this.canRender() && (
        <ApiClientContext.Provider value={this.contextValue}>
          <Container>
            <Component {...pageProps} />
          </Container>
        </ApiClientContext.Provider>
      )
    );
  }

  /** Whether the app is currently being rendered on the browser for the first time. */
  private isFirstBrowserRender() {
    const isRunningInBrowser = typeof window !== "undefined";
    return isRunningInBrowser && !this.hasMounted;
  }

  /** Whether the app is on the 404 page. */
  private isOnErrorPage() {
    return this.props.router.route === "/_error";
  }

  /** Whether the page is ready to be rendered. */
  private canRender() {
    return !this.isFirstBrowserRender() || this.isOnErrorPage();
  }
}
