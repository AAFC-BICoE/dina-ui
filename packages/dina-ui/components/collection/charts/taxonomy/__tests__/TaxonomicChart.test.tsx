import { mountWithAppContext } from "common-ui";
import { waitFor } from "@testing-library/react";
import TaxonomicChart from "../TaxonomicChart";

const mockOption = jest.fn();
jest.mock("echarts-for-react", () => (props: any) => {
  mockOption(props.option);
  return null;
});

const XSS_NAME = '<img src=x onerror="alert(1)">';

const mockPost = jest.fn(async () => ({
  data: {
    aggregations: {
      "sterms#by_kingdom": { buckets: [{ key: XSS_NAME, doc_count: 5 }] }
    }
  }
}));

describe("TaxonomicChart", () => {
  it("HTML-escapes taxon names in the tooltip", async () => {
    mountWithAppContext(<TaxonomicChart query={{ match_all: {} }} />, {
      apiContext: { apiClient: { axios: { post: mockPost } } as any }
    });

    await waitFor(() =>
      expect(mockOption).toHaveBeenLastCalledWith(
        expect.objectContaining({ series: [expect.anything()] })
      )
    );

    const option = mockOption.mock.lastCall[0];
    const html = option.tooltip.formatter({
      treePathInfo: [{}, {}],
      name: XSS_NAME,
      value: 5,
      color: "#fff"
    });

    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img");
  });
});
