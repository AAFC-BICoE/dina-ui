import { screen } from "@testing-library/react";
import { WorkbookTemplateGenerator } from "../../../pages/workbook/generator";
import { mountWithAppContext2 } from "../../../test-util/mock-app-context";

const mockPost = jest.fn();

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "search-api/search-ws/mapping":
      return {
        attributes: [
          { name: "createdOn", type: "date", path: "data.attributes" },
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
              { name: "startEventDateTime", type: "date", path: "attributes" },
              { name: "endEventDateTime", type: "date", path: "attributes" },
              { name: "host", type: "text", path: "attributes" },
              { name: "dwcVerbatimLocality", type: "text", path: "attributes" }
            ]
          }
        ],
        index_name: "dina_material_sample_index"
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
  it("Page Layout", async () => {
    // Generates a snapshot of the generator page. This is used to ensure the design of the page
    // does not change unless intented.
    const wrapper = mountWithAppContext2(<WorkbookTemplateGenerator />, {
      apiContext
    });
    await new Promise(setImmediate);

    expect(wrapper.asFragment()).toMatchSnapshot();
  });
});
