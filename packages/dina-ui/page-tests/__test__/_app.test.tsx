import { render, screen } from "@testing-library/react";
import { AccountContextI, AccountProvider } from "common-ui";
import { ComponentType } from "react";
import DinaUiApp from "../../pages/_app";
import "@testing-library/jest-dom";

// IndexedDB (used by the workbook upload context) is not available in jsdom.
jest.mock("../../components/workbook/WorkbookProvider", () => ({
  ...jest.requireActual("../../components/workbook/WorkbookProvider"),
  WorkbookUploadContextProvider: ({ children }) => children
}));

// The error page's navigation polls the notification API, ErrorBoundaryPage.test.tsx covers it.
jest.mock("../../components/button-bar/nav/nav", () => ({
  ...jest.requireActual("../../components/button-bar/nav/nav"),
  Nav: () => null
}));

const mockPush = jest.fn();

const mockRouter = {
  asPath: "/example-path?a=b",
  pathname: "/example-path",
  push: mockPush
};

// every render gets the same router object, updated in place on navigation.
let router: typeof mockRouter;

// app skips the Keycloak login when an account is already provided.
const TEST_ACCOUNT: AccountContextI = {
  authenticated: true,
  groupNames: ["aafc"],
  initialized: true,
  login: () => undefined,
  logout: () => undefined,
  roles: ["user"],
  getCurrentToken: () => Promise.resolve("test-token"),
  username: "test-user",
  isAdmin: false
};

function appWithPage(
  Component: ComponentType<any>,
  asPath: string,
  pageProps = {}
) {
  Object.assign(router, { asPath, pathname: asPath.split("?")[0] });
  return (
    <AccountProvider value={TEST_ACCOUNT}>
      <DinaUiApp
        router={router as any}
        pageProps={pageProps}
        Component={Component}
      />
    </AccountProvider>
  );
}

describe("DinaUI App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    router = { ...mockRouter };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Renders the App wrapper.", async () => {
    function TestComponent() {
      return <div>Test Content</div>;
    }

    const { container } = render(
      <DinaUiApp
        router={mockRouter as any}
        pageProps={{ exampleProp: "exampleValue" }}
        Component={TestComponent}
      />
    );
    expect(container).toBeInTheDocument();
  });

  it("Shows the next page after navigating away from a page that threw an error", async () => {
    // React logs every error caught by an error boundary.
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    function PageThatThrows(): never {
      throw new Error("The page could not be rendered");
    }
    function NextPage() {
      return <div>Next page content</div>;
    }

    const { rerender } = render(appWithPage(PageThatThrows, "/first-page"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The page could not be rendered"
    );

    rerender(appWithPage(NextPage, "/next-page"));

    expect(await screen.findByText("Next page content")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Shows the next record after a record of the same page threw an error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    function RecordViewPage({ id }: { id: string }) {
      if (id === "1") {
        throw new Error("Record 1 could not be rendered");
      }
      return <div>Record {id}</div>;
    }

    const { rerender } = render(
      appWithPage(RecordViewPage, "/collection/material-sample/view?id=1", {
        id: "1"
      })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Record 1 could not be rendered"
    );

    rerender(
      appWithPage(RecordViewPage, "/collection/material-sample/view?id=2", {
        id: "2"
      })
    );

    expect(await screen.findByText("Record 2")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
