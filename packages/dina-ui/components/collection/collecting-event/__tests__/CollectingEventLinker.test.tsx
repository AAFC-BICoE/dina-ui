import { clearAndType, mountWithAppContext } from "common-ui";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { CollectingEventLinker } from "../CollectingEventLinker";

const mockGet = jest.fn<any, any>(async () => ({
  data: [],
  meta: { totalResourceCount: 0 }
}));

const testCtx = { apiContext: { apiClient: { get: mockGet } } };

/** The params of the last collecting event request. */
function lastLinkerParams() {
  const calls = mockGet.mock.calls.filter(
    ([path]) => path === "collection-api/collecting-event"
  );
  return calls[calls.length - 1]?.[1];
}

describe("CollectingEventLinker component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("Sends the filter form's filters as the filter.", async () => {
    const wrapper = mountWithAppContext(
      <CollectingEventLinker onCollectingEventSelect={jest.fn()} />,
      testCtx
    );

    await clearAndType(
      wrapper.getByRole("textbox", { name: /filter value/i }),
      "abc"
    );
    await userEvent.click(
      wrapper.getByRole("button", { name: /filter list/i })
    );

    await waitFor(() =>
      expect(lastLinkerParams()?.filter).toEqual({
        createdBy: { ILIKE: "%abc%" }
      })
    );
    expect(lastLinkerParams()).not.toHaveProperty("fiql");
  });

  it("Sends an IS NOT partial match as FIQL, which the simple filter can't express.", async () => {
    window.localStorage.setItem(
      "collectingEventFilterForm_filterForm",
      JSON.stringify({
        filterBuilderModel: {
          type: "FILTER_GROUP",
          id: 1,
          operator: "AND",
          children: [
            {
              type: "FILTER_ROW",
              id: 2,
              attribute: "dwcFieldNumber",
              predicate: "IS NOT",
              searchType: "PARTIAL_MATCH",
              value: "a"
            }
          ]
        }
      })
    );
    mountWithAppContext(
      <CollectingEventLinker onCollectingEventSelect={jest.fn()} />,
      testCtx
    );

    await waitFor(() =>
      expect(lastLinkerParams()).toEqual(
        expect.objectContaining({ fiql: "dwcFieldNumber!=*a*" })
      )
    );
    expect(lastLinkerParams()).not.toHaveProperty("filter");
  });
});
