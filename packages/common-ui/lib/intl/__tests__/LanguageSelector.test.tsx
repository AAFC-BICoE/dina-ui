import "@testing-library/jest-dom";
import { fireEvent, waitFor } from "@testing-library/react";
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
    const component = mountWithAppContext(<LanguageSelector />, {
      apiContext
    });

    expect(await component.queryByText("English")).not.toBeInTheDocument();
    expect(await component.findByText("Français")).toBeInTheDocument();
  });

  it("Lets you change the locale.", async () => {
    const component = mountWithAppContext(<LanguageSelector />, {
      apiContext
    });

    // Initially the locale should be set to "en":
    const langButton = await component.findByText("Français");
    expect(langButton).toBeInTheDocument();

    fireEvent.click(langButton);

    waitFor(async () => {
      // The locale should have been changed to "fr":
      expect(await component.findByText("English")).toBeInTheDocument();
      expect(await component.findByText("Français")).not.toBeInTheDocument();
    });
  });

  it("Doesn't render server-side.", async () => {
    // Pretend this test is not running in the browser:
    (process as any).browser = false;

    const component = mountWithAppContext(<LanguageSelector />);
    expect(await component.queryByTestId("languageSelector")).toBeNull();
  });
});
