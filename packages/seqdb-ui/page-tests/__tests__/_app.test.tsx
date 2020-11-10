import { shallow } from "enzyme";
import SeqdbUiApp from "../../pages/_app";

const mockPush = jest.fn();

const mockRouter = {
  asPath: "/example-path?a=b",
  push: mockPush
};

describe("SeqdbUiApp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders the App wrapper.", async () => {
    function TestComponent() {
      return <div>Test Content</div>;
    }

    shallow(
      <SeqdbUiApp
        router={mockRouter as any}
        pageProps={{ exampleProp: "exampleValue" }}
        Component={TestComponent}
      />
    );
  });
});
