import Kitsu from "kitsu";
import Router from "next/router";
import { FunctionComponent } from "react";
import { create } from "react-test-renderer";
import { ApiClientContext } from "../../components/api-client/ApiClientContext";
import SeqdbUiApp from "../_app";
import { shallow } from "enzyme";
import toJson from "enzyme-to-json";

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
    expect(toJson(wrapper)).toMatchSnapshot("SeqdbUiApp shallow render");
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
