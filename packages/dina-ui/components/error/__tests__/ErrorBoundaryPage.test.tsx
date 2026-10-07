import { writeStorage } from "@rehooks/local-storage";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { mountWithAppContext } from "common-ui";
import { useEffect } from "react";
import { ErrorBoundaryPage } from "../ErrorBoundaryPage";

let mockNavThrows = false;

jest.mock("../../button-bar/nav/nav", () => {
  const { createElement } = jest.requireActual("react");
  const actualNavModule = jest.requireActual("../../button-bar/nav/nav");
  return {
    ...actualNavModule,
    Nav: (props) => {
      if (mockNavThrows) {
        throw new Error("The navigation could not be rendered");
      }
      return createElement(actualNavModule.Nav, props);
    }
  };
});

function PageThatThrows(): never {
  throw new Error("The page could not be rendered");
}

describe("ErrorBoundaryPage", () => {
  beforeEach(() => {
    mockNavThrows = false;
    // React logs every error caught by an error boundary.
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Renders the page when it does not throw an error", () => {
    const wrapper = mountWithAppContext(
      <ErrorBoundaryPage resetKey="/first-page">
        <div>First page</div>
      </ErrorBoundaryPage>
    );

    expect(wrapper.getByText("First page")).toBeInTheDocument();
    expect(wrapper.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Shows the error with the navigation and footer when the page throws an error", () => {
    const wrapper = mountWithAppContext(
      <ErrorBoundaryPage resetKey="/first-page">
        <PageThatThrows />
      </ErrorBoundaryPage>
    );

    expect(wrapper.getByRole("alert")).toHaveTextContent(
      "Something went wrong"
    );
    expect(
      wrapper.getByText("The page could not be rendered")
    ).toBeInTheDocument();
    expect(wrapper.getByRole("banner")).toBeInTheDocument();
    expect(wrapper.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("Shows the next page after navigating away from a page that threw an error", () => {
    const wrapper = mountWithAppContext(
      <ErrorBoundaryPage resetKey="/first-page">
        <PageThatThrows />
      </ErrorBoundaryPage>
    );
    expect(wrapper.getByRole("alert")).toBeInTheDocument();

    wrapper.rerender(
      <ErrorBoundaryPage resetKey="/second-page">
        <div>Second page</div>
      </ErrorBoundaryPage>
    );

    expect(wrapper.getByText("Second page")).toBeInTheDocument();
    expect(wrapper.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Shows the error of a page reached by navigation, then the next page after navigating away", () => {
    const wrapper = mountWithAppContext(
      <ErrorBoundaryPage resetKey="/first-page">
        <div>First page</div>
      </ErrorBoundaryPage>
    );

    wrapper.rerender(
      <ErrorBoundaryPage resetKey="/second-page">
        <PageThatThrows />
      </ErrorBoundaryPage>
    );
    expect(wrapper.getByRole("alert")).toHaveTextContent(
      "The page could not be rendered"
    );

    wrapper.rerender(
      <ErrorBoundaryPage resetKey="/third-page">
        <div>Third page</div>
      </ErrorBoundaryPage>
    );
    expect(wrapper.getByText("Third page")).toBeInTheDocument();
    expect(wrapper.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Shows the next page after navigating away from a second page that threw an error", () => {
    const wrapper = mountWithAppContext(
      <ErrorBoundaryPage resetKey="/first-page">
        <PageThatThrows />
      </ErrorBoundaryPage>
    );

    wrapper.rerender(
      <ErrorBoundaryPage resetKey="/second-page">
        <PageThatThrows />
      </ErrorBoundaryPage>
    );
    expect(wrapper.getByRole("alert")).toBeInTheDocument();

    wrapper.rerender(
      <ErrorBoundaryPage resetKey="/third-page">
        <div>Third page</div>
      </ErrorBoundaryPage>
    );
    expect(wrapper.getByText("Third page")).toBeInTheDocument();
    expect(wrapper.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Shows the next page in the same render as the navigation, so the route announcer reads its title", () => {
    // Like Next.js's route announcer, reads the page in an effect of the render that changed the route.
    const pageAtNavigation: string[] = [];
    function RouteAnnouncerProbe({ path }: { path: string }) {
      useEffect(() => {
        pageAtNavigation.push(
          document.querySelector("[role=alert]") ? "error page" : "next page"
        );
      }, [path]);
      return null;
    }

    const wrapper = mountWithAppContext(
      <>
        <RouteAnnouncerProbe path="/first-page" />
        <ErrorBoundaryPage resetKey="/first-page">
          <PageThatThrows />
        </ErrorBoundaryPage>
      </>
    );
    wrapper.rerender(
      <>
        <RouteAnnouncerProbe path="/second-page" />
        <ErrorBoundaryPage resetKey="/second-page">
          <div>Second page</div>
        </ErrorBoundaryPage>
      </>
    );

    expect(pageAtNavigation).toEqual(["error page", "next page"]);
  });

  it("Keeps showing the error when the page re-renders without navigating", () => {
    const wrapper = mountWithAppContext(
      <ErrorBoundaryPage resetKey="/first-page">
        <PageThatThrows />
      </ErrorBoundaryPage>
    );

    wrapper.rerender(
      <ErrorBoundaryPage resetKey="/first-page">
        <div>First page</div>
      </ErrorBoundaryPage>
    );

    expect(wrapper.getByRole("alert")).toBeInTheDocument();
    expect(wrapper.queryByText("First page")).not.toBeInTheDocument();
  });

  it("Keeps the page mounted when the route changes without an error", () => {
    let pageMounts = 0;
    function SearchPage() {
      useEffect(() => {
        pageMounts++;
      }, []);
      return <div>Search page</div>;
    }

    const wrapper = mountWithAppContext(
      <ErrorBoundaryPage resetKey="/search?q=a">
        <SearchPage />
      </ErrorBoundaryPage>
    );
    wrapper.rerender(
      <ErrorBoundaryPage resetKey="/search?q=ab">
        <SearchPage />
      </ErrorBoundaryPage>
    );

    expect(wrapper.getByText("Search page")).toBeInTheDocument();
    expect(pageMounts).toEqual(1);
  });

  it("Renders the page again when Try Again is clicked", async () => {
    let pageThrows = true;
    function PageThatThrowsOnce() {
      if (pageThrows) {
        throw new Error("The page could not be rendered");
      }
      return <div>First page</div>;
    }

    const wrapper = mountWithAppContext(
      <ErrorBoundaryPage resetKey="/first-page">
        <PageThatThrowsOnce />
      </ErrorBoundaryPage>
    );
    expect(wrapper.getByRole("alert")).toBeInTheDocument();

    pageThrows = false;
    await userEvent.click(wrapper.getByRole("button", { name: "Try Again" }));

    expect(wrapper.getByText("First page")).toBeInTheDocument();
    expect(wrapper.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Keeps the page mounted on later route changes after Try Again worked", async () => {
    let pageThrows = true;
    let pageMounts = 0;
    function SearchPageThatThrowsOnce() {
      useEffect(() => {
        pageMounts++;
      }, []);
      if (pageThrows) {
        throw new Error("The page could not be rendered");
      }
      return <div>Search page</div>;
    }

    const wrapper = mountWithAppContext(
      <ErrorBoundaryPage resetKey="/search?q=a">
        <SearchPageThatThrowsOnce />
      </ErrorBoundaryPage>
    );
    pageThrows = false;
    await userEvent.click(wrapper.getByRole("button", { name: "Try Again" }));
    expect(pageMounts).toEqual(1);

    wrapper.rerender(
      <ErrorBoundaryPage resetKey="/search?q=ab">
        <SearchPageThatThrowsOnce />
      </ErrorBoundaryPage>
    );

    expect(wrapper.getByText("Search page")).toBeInTheDocument();
    expect(pageMounts).toEqual(1);
  });

  it("Shows the Try Again button in French when the user's language is French", () => {
    writeStorage("locale", "fr");

    const wrapper = mountWithAppContext(
      <ErrorBoundaryPage resetKey="/first-page">
        <PageThatThrows />
      </ErrorBoundaryPage>
    );

    expect(
      wrapper.getByRole("button", { name: "Réessayer" })
    ).toBeInTheDocument();
  });

  it("Still shows the error when the navigation also throws an error", () => {
    mockNavThrows = true;

    const wrapper = mountWithAppContext(
      <ErrorBoundaryPage resetKey="/first-page">
        <PageThatThrows />
      </ErrorBoundaryPage>
    );

    expect(wrapper.getByRole("alert")).toHaveTextContent(
      "The page could not be rendered"
    );
    expect(
      wrapper.getByRole("button", { name: "Try Again" })
    ).toBeInTheDocument();
  });
});
