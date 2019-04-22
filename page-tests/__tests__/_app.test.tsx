import Kitsu from "kitsu";
import Router from "next/router";
import { FunctionComponent } from "react";
import { create } from "react-test-renderer";
import { ApiClientContext } from "../../components/api-client/ApiClientContext";
import SeqdbUiApp from "../../pages/_app";
import { shallow } from "enzyme";
//import toJson from "enzyme-to-json";

jest.mock("next/router", () => ({
  withRouter: component => {
    component.defaultProps = {
      ...component.defaultProps,
      router: { pathname: '' }
    }
    return component
  }
}));

describe("SeqdbUiApp", () => {
  it("Renders the App wrapper.", () => {
    const TestComponent: FunctionComponent = () => <div />;

    const wrapper = shallow(<SeqdbUiApp
      router={Router}
      pageProps={{ exampleProp: "exampleValue" }}
      Component={TestComponent}
    />)
    //due to the travis generated snapshot has different path than local generated,
    //snapshot only matches when runing test locallly, failed at travis build, so here is 
    //just a replacement
    expect(wrapper.find('LoadNamespace(NextStaticProvider)').length).toEqual(1)

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

    create(
      <SeqdbUiApp
        router={Router}
        pageProps={{ exampleProp: "exampleValue" }}
        Component={pageComponent}
      />
    );
  });
});
