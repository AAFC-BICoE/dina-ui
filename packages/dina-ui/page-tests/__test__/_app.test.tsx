import { shallow } from "enzyme";
import DinaUiApp from "../../pages/_app";

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

    shallow(
      <DinaUiApp
        router={mockRouter as any}
        pageProps={{ exampleProp: "exampleValue" }}
        Component={TestComponent}
      />
    );
  });
});
