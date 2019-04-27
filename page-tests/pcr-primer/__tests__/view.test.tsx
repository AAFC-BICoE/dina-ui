import { mount } from "enzyme";
import { ApiClientContext, createContextValue } from "../../../components";
import { PcrPrimer } from "../../../types/seqdb-api/resources/PcrPrimer";
import { PcrPrimerDetailsPage } from "../../../pages/pcr-primer/view";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

const TEST_PRIMER: PcrPrimer = {
  group: { id: "1", groupName: "Test Group", type: "group" },
  id: "5",
  lotNumber: 1,
  name: "Test Primer",
  seq: "test seq",
  type: "PRIMER"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_PRIMER
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

describe("PcrPrimer details page", () => {
  function mountWithContext(element: JSX.Element) {
    return mount(
      <I18nextProvider i18n={i18next} >
        <ApiClientContext.Provider value={createContextValue()}>
          {element}
        </ApiClientContext.Provider>
      </I18nextProvider>
    );
  }

  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithContext(
      <PcrPrimerDetailsPage router={{ query: { id: "100" } } as any} />
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the PCR primer details", async () => {
    const wrapper = mountWithContext(
      <PcrPrimerDetailsPage router={{ query: { id: "100" } } as any} />
    );

    // Wait for the page to load.
    await Promise.resolve();
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The primer's name should be rendered in a FieldView.
    expect(
      wrapper.containsMatchingElement(
        <strong>Name</strong>
      )
    ).toEqual(true);
    expect(
      wrapper.containsMatchingElement(
        <p>Test Primer</p>
      )
    ).toEqual(true);
  });
});
