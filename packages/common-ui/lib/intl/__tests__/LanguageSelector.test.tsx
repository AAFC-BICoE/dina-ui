import { mountWithAppContext } from "../../test-util/mock-app-context";
import { LanguageSelector } from "../LanguageSelector";

const INSTANCE_DATA = {
  data: {
    "instance-mode": "developer",
    "supported-languages-iso": "en,fr"
  },
  status: 200,
  statusText: "",
  headers: {
    "content-length": "99",
    "content-type": "text/plain; charset=utf-8",
    date: "Tue, 09 Jan 2024 17:03:48 GMT"
  },
  config: {
    url: "/instance.json",
    method: "get",
    headers: {
      Accept: "application/json, text/plain, */*"
    },
    transformRequest: [null],
    transformResponse: [null],
    timeout: 0,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    maxContentLength: -1
  },
  request: {}
};
const mockGetAxios = jest.fn(async (_path) => {
  return INSTANCE_DATA;
});

const apiContext = {
  apiClient: {
    get: mockGetAxios,
    axios: {
      get: mockGetAxios
    }
  }
} as any;

describe("LanguageSelector component", () => {
  beforeEach(() => {
    // Pretend the tests are running in the browser:
    (process as any).browser = true;
  });
  afterEach(() => {
    // Pretend the tests are running in the browser:
    (process as any).browser = true;
  });

  it("Renders the language selector.", async () => {
    const wrapper = mountWithAppContext(<LanguageSelector />, {
      apiContext
    });
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find("button[children='English']").exists()).toEqual(false);
    expect(wrapper.find("button[children='Français']").exists()).toEqual(true);
  });

  it("Lets you change the locale.", async () => {
    const wrapper = mountWithAppContext(<LanguageSelector />, {
      apiContext
    });
    await new Promise(setImmediate);
    wrapper.update();

    // Initially the locale should be set to "en":
    expect(wrapper.find("button[children='Français']").exists()).toEqual(true);

    wrapper.find("button[children='Français']").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // The locale should have been changed to "fr":
    expect(wrapper.find("button[children='Français']").exists()).toEqual(false);
    expect(wrapper.find("button[children='English']").exists()).toEqual(true);
  });

  it("Doesn't render server-side.", () => {
    // Pretend this test is not running in the browser:
    (process as any).browser = false;

    const wrapper = mountWithAppContext(<LanguageSelector />);
    expect(wrapper.find(LanguageSelector).html()).toEqual(null);
  });
});
