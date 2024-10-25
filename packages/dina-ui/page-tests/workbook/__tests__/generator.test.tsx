import { waitFor } from "@testing-library/react";
import { WorkbookTemplateGenerator } from "../../../pages/workbook/generator";
import { mountWithAppContext2 } from "../../../test-util/mock-app-context";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockPost = jest.fn();

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "search-api/search-ws/mapping":
      return {
        data: {
          attributes: [
            { name: "barcode", type: "date", path: "data.attributes" },
            {
              name: "materialSampleName",
              type: "text",
              fields: ["keyword"],
              path: "data.attributes"
            }
          ],
          relationships: [
            {
              referencedBy: "collectingEvent",
              name: "type",
              path: "included",
              value: "collecting-event",
              attributes: [
                { name: "createdBy", type: "text", path: "attributes" },
                { name: "createdOn", type: "date", path: "attributes" },
                { name: "tags", type: "text", path: "attributes" },
                { name: "habitat", type: "text", path: "attributes" },
                { name: "substrate", type: "text", path: "attributes" },
                {
                  name: "dwcOtherRecordNumbers",
                  type: "text",
                  path: "attributes"
                },
                { name: "dwcRecordNumber", type: "text", path: "attributes" },
                {
                  name: "startEventDateTime",
                  type: "date",
                  path: "attributes"
                },
                { name: "endEventDateTime", type: "date", path: "attributes" },
                { name: "host", type: "text", path: "attributes" },
                {
                  name: "dwcVerbatimLocality",
                  type: "text",
                  path: "attributes"
                }
              ]
            }
          ],
          index_name: "dina_material_sample_index"
        }
      };
    default:
      return { data: [] };
  }
});

const apiContext: any = {
  get: mockGet,
  apiClient: { axios: { post: mockPost, get: mockGet } }
};

describe("Workbook Template Generator", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Page Layout", async () => {
    // Generates a snapshot of the generator page. This is used to ensure the design of the page
    // does not change unless intented.
    const wrapper = mountWithAppContext2(<WorkbookTemplateGenerator />, {
      apiContext
    });
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    expect(wrapper.asFragment()).toMatchSnapshot();
  });

  it("Select multiple columns and set aliases", async () => {
    const wrapper = mountWithAppContext2(<WorkbookTemplateGenerator />, {
      apiContext
    });
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    // Click the "Add new column" dropdown
    userEvent.click(wrapper.getByRole("combobox"));
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(9);
    });

    // Select "Primary ID", give it alias of "Sample Name"
    userEvent.click(wrapper.getAllByRole("option", { name: /primary id/i })[0]);
    userEvent.click(wrapper.getAllByRole("button", { name: /add column/i })[0]);
    await new Promise(setImmediate);
    userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Sample Name"
    );

    // Select "Barcode", give it alias of "Bar code"
    userEvent.click(wrapper.getByRole("combobox"));
    userEvent.click(wrapper.getByRole("option", { name: /barcode/i }));
    userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await new Promise(setImmediate);
    userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Bar code"
    );

    // Generate the template.
    userEvent.click(
      wrapper.getByRole("button", { name: /generate template/i })
    );
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
    expect(mockPost).toHaveBeenCalledWith(
      "objectstore-api/workbook/generation",
      {
        data: {
          attributes: {
            aliases: ["Sample Name", "Bar code"],
            columns: ["materialSampleName", "barcode"]
          },
          type: "workbook-generation"
        }
      },
      {
        headers: {
          "Content-Type": "application/vnd.api+json"
        },
        responseType: "blob"
      }
    );
  });

  it("Select multiple columns and do not set aliases", async () => {
    const wrapper = mountWithAppContext2(<WorkbookTemplateGenerator />, {
      apiContext
    });
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    // Click the "Add new column" dropdown
    userEvent.click(wrapper.getByRole("combobox"));
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(9);
    });

    // Select "Primary ID", give it alias of "Sample Name"
    userEvent.click(wrapper.getAllByRole("option", { name: /primary id/i })[0]);
    userEvent.click(wrapper.getAllByRole("button", { name: /add column/i })[0]);
    await new Promise(setImmediate);

    // Select "Barcode", give it alias of "Bar code"
    userEvent.click(wrapper.getByRole("combobox"));
    userEvent.click(wrapper.getByRole("option", { name: /barcode/i }));
    userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await new Promise(setImmediate);

    // Generate the template.
    userEvent.click(
      wrapper.getByRole("button", { name: /generate template/i })
    );
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
    expect(mockPost).toHaveBeenCalledWith(
      "objectstore-api/workbook/generation",
      {
        data: {
          attributes: {
            columns: ["materialSampleName", "barcode"]
          },
          type: "workbook-generation"
        }
      },
      {
        headers: {
          "Content-Type": "application/vnd.api+json"
        },
        responseType: "blob"
      }
    );
  });

  it("Template name validation", async () => {
    const wrapper = mountWithAppContext2(<WorkbookTemplateGenerator />, {
      apiContext
    });
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    // Click the "Add new column" dropdown
    userEvent.click(wrapper.getByRole("combobox"));
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(9);
    });

    // Select "Primary ID", give it alias of "Sample Name"
    userEvent.click(wrapper.getAllByRole("option", { name: /primary id/i })[0]);
    userEvent.click(wrapper.getAllByRole("button", { name: /add column/i })[0]);
    await new Promise(setImmediate);

    // Put an invalid template name
    userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Test.xlsx"
    );
    mockPost.mockReturnValue("pretendFileData");
    userEvent.click(
      wrapper.getByRole("button", { name: /generate template/i })
    );
    await new Promise(setImmediate);

    expect(wrapper.getByRole("alert")).toBeInTheDocument();
  });
});
