import { mount } from "enzyme";
import { FunctionComponent } from "react";
import SeqdbDocument from "../../pages/_document";

const mockPush = jest.fn();

const mockRouter = {
  asPath: "/example-path?a=b",
  push: mockPush
};

const TestComponent: FunctionComponent = () => <div />;
const testQuery = {};

/* tslint:disable-next-line */
const __NEXT_DATA__test = {
  buildId: "1",
  page: "page",
  pathname: "ab",
  props: {
    Component: TestComponent,
    pageProps: "any",
    router: mockRouter
  },
  query: testQuery
};

const docProps = {
  assetPrefix: "",
  buildManifest: ["string"],
  dev: true,
  devFiles: ["undefined"],
  dynamicImports: ["undefined"],
  files: ["undefined"],
  staticMarkup: false,
  /* tslint:disable-next-line */
  __NEXT_DATA__: __NEXT_DATA__test
};
describe("SeqdbDocument", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders the SeqdbDocument doc wrapper.", async () => {
    const wrapper = mount(<SeqdbDocument {...docProps} />);
    const html = wrapper.find("html");
    expect(html.prop("lang")).toEqual("en");
  });
});
