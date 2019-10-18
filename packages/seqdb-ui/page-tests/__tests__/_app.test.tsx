import { ApiClientContext } from "common-ui";
import { mount } from "enzyme";
import Kitsu from "kitsu";
import { FunctionComponent } from "react";
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
    const TestComponent: FunctionComponent = () => <div>Test Content</div>;

    const wrapper = mount(
      <SeqdbUiApp
        router={mockRouter as any}
        pageProps={{ exampleProp: "exampleValue" }}
        Component={TestComponent}
      />
    );

    // It should render the div from the TestComponent.
    expect(wrapper.html()).toEqual("<div>Test Content</div>");

    const innerComponent = wrapper.find(TestComponent);
    expect(innerComponent.prop("exampleProp")).toEqual("exampleValue");
  });

  it("Provides the API context to child components.", done => {
    function pageComponent() {
      return (
        <ApiClientContext.Consumer>
          {context => {
            expect(context.apiClient instanceof Kitsu).toBeTruthy();
            expect(typeof context.doOperations).toEqual("function");
            done();
            return null;
          }}
        </ApiClientContext.Consumer>
      );
    }

    mount(
      <SeqdbUiApp
        router={mockRouter as any}
        pageProps={{}}
        Component={pageComponent}
      />
    );
  });
});
