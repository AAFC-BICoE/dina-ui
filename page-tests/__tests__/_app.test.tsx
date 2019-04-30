import { mount } from "enzyme";
import Kitsu from "kitsu";
import { FunctionComponent } from "react";
import { ApiClientContext } from "../../components/api-client/ApiClientContext";
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
    const TestComponent: FunctionComponent = () => <div />;

    const wrapper = mount(
      <SeqdbUiApp
        router={mockRouter as any}
        pageProps={{ exampleProp: "exampleValue" }}
        Component={TestComponent}
      />
    );

    // The first browser render should be empty.
    expect(wrapper.html()).toEqual(null);

    expect(mockPush).lastCalledWith("/example-path?a=b");
    // Normally the router would update the app wrapper, but the mock doesn't, so we force a
    // re-render in the test.
    wrapper.instance().forceUpdate();
    wrapper.update();

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

    const wrapper = mount(
      <SeqdbUiApp
        router={mockRouter as any}
        pageProps={{}}
        Component={pageComponent}
      />
    );

    expect(mockPush).lastCalledWith("/example-path?a=b");
    // Normally the router would update the app wrapper, but the mock doesn't, so we force a
    // re-render in the test.
    wrapper.instance().forceUpdate();
    wrapper.update();
  });
});
