import { ApiClientContext } from "common-ui";
import { mount, shallow } from "enzyme";
import Kitsu from "kitsu";
import { FunctionComponent } from "react";
import ObjectStoreUiApp from "../../pages/_app";

const mockPush = jest.fn();

const mockRouter = {
  asPath: "/example-path?a=b",
  push: mockPush
};

describe("ObjectStoreUI App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders the App wrapper.", async () => {
    function TestComponent() {
      return <div>Test Content</div>;
    }

    shallow(
      <ObjectStoreUiApp
        router={mockRouter as any}
        pageProps={{ exampleProp: "exampleValue" }}
        Component={TestComponent}
      />
    );
  });
});
