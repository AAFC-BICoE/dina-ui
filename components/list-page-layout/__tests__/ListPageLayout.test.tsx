import { mount } from "enzyme";
import { act } from "react-test-renderer";
import { ApiClientContext, createContextValue } from "../../../components";
import { ListPageLayout } from "../ListPageLayout";

/** Mock Kitsu "get" method. */
const mockGet = jest.fn();

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

function mountWithContext(element: JSX.Element) {
  return mount(
    <ApiClientContext.Provider value={createContextValue()}>
      {element}
    </ApiClientContext.Provider>
  );
}

describe("ListPageLayout component", () => {
  it("Has a reset button to clear the filter form.", async () => {
    const wrapper = mountWithContext(
      <ListPageLayout
        filterAttributes={["name"]}
        queryTableProps={{
          columns: ["name", "type"],
          path: "pcrPrimer"
        }}
      />
    );

    // Wait for the default search to finish.
    await Promise.resolve();
    wrapper.update();

    // Do a filtered search.
    wrapper
      .find("input.filter-value")
      .simulate("change", { target: { value: "101F" } });
    wrapper.find("form").simulate("submit");

    await act(async () => {
      await new Promise(setImmediate);
    });

    // There should be an RSQL filter.
    expect(mockGet).lastCalledWith(
      expect.anything(),
      expect.objectContaining({
        filter: { rsql: "name==*101F*" }
      })
    );

    // Click the reset button.
    act(() => {
      wrapper.find("button[children='Reset']").simulate("click");
    });

    // There should be no RSQL filter.
    expect(mockGet).lastCalledWith(
      expect.anything(),
      expect.objectContaining({
        filter: { rsql: "" }
      })
    );
  });
});
