import { mountWithAppContext } from "common-ui";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DateHistogram from "../DateHistogram";

jest.mock("echarts-for-react", () => () => null);

const mockPost = jest.fn(async () => ({ data: { aggregations: {} } }));

describe("DateHistogram", () => {
  it("groups the presets under one header per interval", async () => {
    mountWithAppContext(
      <DateHistogram
        indexName="dina_material_sample_index"
        dateFieldPath="data.attributes.createdOn"
        queryBuilderFieldPath="data.attributes.createdOn"
        renderTitle={() => "Title"}
      />,
      { apiContext: { apiClient: { axios: { post: mockPost } } as any } }
    );
    await waitFor(() => expect(mockPost).toHaveBeenCalled());

    await userEvent.click(screen.getByRole("button", { name: "All Time" }));

    const headers = screen
      .getAllByRole("heading")
      .map((header) => header.textContent);
    expect(headers).toEqual(["Real-time", "By Day", "By Month", "By Year"]);
    expect(screen.getAllByRole("button", { name: /./ }).length).toBe(10); // toggle + 9 presets
  });
});
