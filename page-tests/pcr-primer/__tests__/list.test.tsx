import { mount } from "enzyme";
import i18next from "i18next";
import { I18nextProvider } from "react-i18next";
import { ApiClientContext, createContextValue } from "../../../components";
import PcrPrimerListPage from "../../../pages/pcr-primer/list";
import { PcrPrimer } from "../../../types/seqdb-api/resources/PcrPrimer";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_PRIMERS: PcrPrimer[] = [
  {
    group: { id: "1", groupName: "Test Group", type: "group" },
    id: "4",
    lotNumber: 1,
    name: "Test Primer 1",
    seq: "test seq",
    type: "PRIMER"
  },
  {
    group: { id: "1", groupName: "Test Group", type: "group" },
    id: "5",
    lotNumber: 1,
    name: "Test Primer 2",
    seq: "test seq",
    type: "PRIMER"
  }
];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_PRIMERS
  };
});

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

describe("PcrPrimer list page", () => {
  function mountWithContext(element: JSX.Element) {
    return mount(
      <I18nextProvider i18n={i18next}>
        <ApiClientContext.Provider value={createContextValue()}>
          {element}
        </ApiClientContext.Provider>
      </I18nextProvider>
    );
  }

  it("Renders the list page.", async () => {
    const wrapper = mountWithContext(<PcrPrimerListPage />);

    await Promise.resolve();
    wrapper.update();

    // Check that the table contains the links to primer details pages.
    expect(wrapper.containsMatchingElement(<a>Test Primer 1</a>)).toEqual(true);
    expect(wrapper.containsMatchingElement(<a>Test Primer 2</a>)).toEqual(true);
  });
});
