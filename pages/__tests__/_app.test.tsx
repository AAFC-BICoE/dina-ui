import Kitsu from "kitsu";
import Router from "next/router";
import { FunctionComponent } from "react";
import { create } from "react-test-renderer";
import { createRenderer } from "react-test-renderer/shallow";
import { ApiClientContext } from "../../components/api-client/ApiClientContext";
import SeqdbUiApp from "../_app";

jest.mock("next/router", () => ({}));

describe("SeqdbUiApp", () => {
  it("Renders the App wrapper.", () => {
    const TestComponent: FunctionComponent = () => <div />;

    const shallowRender = createRenderer().render(
      <SeqdbUiApp
        router={Router}
        pageProps={{ exampleProp: "exampleValue" }}
        Component={TestComponent}
      />
    );

    expect(shallowRender).toMatchSnapshot("SeqdbUiApp shallow render.");
  });

  it("Provides the API context to child components.", done => {
    create(
      <SeqdbUiApp
        router={Router}
        pageProps={{ exampleProp: "exampleValue" }}
        Component={() => (
          <ApiClientContext.Consumer>
            {context => {
              expect(context.apiClient instanceof Kitsu).toBeTruthy();
              done();
              return null;
            }}
          </ApiClientContext.Consumer>
        )}
      />
    );
  });
});
