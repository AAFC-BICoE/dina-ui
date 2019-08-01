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
