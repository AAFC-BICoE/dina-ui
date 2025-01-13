import { render } from "@testing-library/react";
import DinaUiApp from "../../pages/_app";
import "@testing-library/jest-dom";

const mockPush = jest.fn();

const mockRouter = {
  asPath: "/example-path?a=b",
  push: mockPush
};

describe("DinaUI App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
