import { mount } from "enzyme";
import { DocumentProps } from "next/document";
import { FunctionComponent } from "react";
import SeqdbDocument from "../../pages/_document";

const mockPush = jest.fn();

const mockRouter = {
  asPath: "/example-path?a=b",
  push: mockPush
};

const TestComponent: FunctionComponent = () => <div />;
const testQuery = {};

const docProps: Partial<DocumentProps> = {
  __NEXT_DATA__: {
    buildId: "1",
    dataManager: "dataMnager",
    page: "page",
    props: {
      Component: TestComponent,
      pageProps: "any",
      router: mockRouter
    },
    query: testQuery
  },
  assetPrefix: "",
  devFiles: ["undefined"],
  dynamicImports: [],
  files: ["undefined"],
  html: "",
  staticMarkup: false
};
describe("SeqdbDocument", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders the SeqdbDocument doc wrapper.", async () => {
    const wrapper = mount(<SeqdbDocument {...(docProps as DocumentProps)} />);
    const html = wrapper.find("html");
    expect(html.prop("lang")).toEqual("en");
  });
});
