import { titleCell, descriptionCell, ListPageLayout } from "../..";
import { mountWithAppContext } from "common-ui";
import { ColumnDefinition } from "../QueryTable";
import "@testing-library/jest-dom";
import { fireEvent } from "@testing-library/react";

const LONG_DESCRIPTION = "Long description ".repeat(10).trim();

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/entities":
      return {
        data: [
          {
            id: "407a4891-a6b8-406f-aee1-1c23293c1dd1",
            name: "bothProvided",
            multilingualTitle: {
              titles: [
                { lang: "en", title: "Row 1: English Title" },
                { lang: "fr", title: "Row 1: French Title" }
              ]
            },
            multilingualDescription: {
              descriptions: [
                { lang: "en", desc: "Row 1: English Description" },
                { lang: "fr", desc: "Row 1: French Description" }
              ]
            }
          },
          {
            id: "752c5760-97a2-4898-ba22-cff5760905e4",
            name: "englishOnly",
            multilingualTitle: {
              titles: [{ lang: "en", title: "Row 2: English Title" }]
            },
            multilingualDescription: {
              descriptions: [{ lang: "en", desc: "Row 2: English Description" }]
            }
          },
          {
            id: "6d0d4b4c-2ae1-4ecc-a020-e1f0d8fc15c1",
            name: "frenchOnly",
            multilingualTitle: {
              titles: [{ lang: "fr", title: "Row 3: French Title" }]
            },
            multilingualDescription: {
              descriptions: [{ lang: "fr", desc: "Row 3: French Description" }]
            }
          },
          {
            id: "6d0d4b4c-2ae1-4ecc-a020-e1f0d8fc15c1",
            name: "noneProvided",
            multilingualTitle: {},
            multilingualDescription: {}
          },
          {
            id: "0b8f7d2e-3c1a-4f5b-9e6d-2a7c8b9d0e1f",
            name: "longDescription",
            multilingualTitle: {},
            multilingualDescription: {
              descriptions: [{ lang: "en", desc: LONG_DESCRIPTION }]
            }
          }
        ]
      };
  }
});

const mockApiCtx: any = {
  apiClient: {
    get: mockGet,
    axios: {
      get: mockGet
    }
  }
};

describe("Multilingual-Cell components", () => {
  it("Display only one language in the table at a time", async () => {
    const TABLE_COLUMNS: ColumnDefinition<any>[] = [
      "name",
      titleCell(false, false, "multilingualTitle"),
      descriptionCell(false, false, "multilingualDescription")
    ];

    const englishRender = mountWithAppContext(
      <ListPageLayout
        filterAttributes={["name"]}
        id="multilingual-cell-list-test"
        queryTableProps={{
          columns: TABLE_COLUMNS,
          path: "collection-api/entities"
        }}
      />,
      { apiContext: mockApiCtx }
    );
    const reactTable = await englishRender.findByTestId("ReactTable");
    expect(reactTable).toBeInTheDocument();

    // Row 1 expectations (both provided):
    expect(
      await englishRender.findByText("Row 1: English Title")
    ).toBeInTheDocument();
    expect(
      englishRender.queryByText("Row 1: English Description")
    ).toBeInTheDocument();

    // Row 2 expectations (english only):
    expect(
      englishRender.queryByText("Row 2: English Title")
    ).toBeInTheDocument();
    expect(
      englishRender.queryByText("Row 2: English Description")
    ).toBeInTheDocument();

    // Row 3 expectations (french only):
    expect(
      englishRender.queryByText("Row 3: French Title")
    ).toBeInTheDocument();
    expect(
      englishRender.queryByText("Row 3: French Description")
    ).toBeInTheDocument();

    // Row 4 expectations (None)
    expect(
      englishRender.container.querySelector(
        "table > tbody > tr:nth-child(4) > td:nth-child(2)"
      )
    ).toHaveTextContent("");
    expect(
      englishRender.container.querySelector(
        "table > tbody > tr:nth-child(4) > td:nth-child(3)"
      )
    ).toHaveTextContent("");
  });

  it("Truncates long values with a toggle to show the full text", async () => {
    const wrapper = mountWithAppContext(
      <ListPageLayout
        filterAttributes={["name"]}
        id="multilingual-cell-list-test"
        queryTableProps={{
          columns: [
            "name",
            descriptionCell(false, false, "multilingualDescription")
          ],
          path: "collection-api/entities"
        }}
      />,
      { apiContext: mockApiCtx }
    );

    const showMore = await wrapper.findByRole("button", { name: "Show More" });
    // Only the long description gets a toggle:
    expect(wrapper.getAllByRole("button", { name: "Show More" })).toHaveLength(
      1
    );
    expect(wrapper.queryByText(LONG_DESCRIPTION)).not.toBeInTheDocument();
    expect(
      wrapper.getByText(`${LONG_DESCRIPTION.slice(0, 100).trimEnd()}…`, {
        exact: false
      })
    ).toBeInTheDocument();

    fireEvent.click(showMore);
    expect(
      wrapper.getByText(LONG_DESCRIPTION, { exact: false })
    ).toBeInTheDocument();

    fireEvent.click(wrapper.getByRole("button", { name: "Show Less" }));
    expect(
      wrapper.getByRole("button", { name: "Show More" })
    ).toBeInTheDocument();
  });
});
