import { screen, waitFor } from "@testing-library/react";
import { WorkbookTemplateGenerator } from "../../../pages/workbook/generator";
import { mountWithAppContext2 } from "../../../test-util/mock-app-context";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockPost = jest.fn();

const mockGet = jest.fn<any, any>(async (path, options) => {
  switch (path) {
    case "collection-api/managed-attribute":
      switch (options?.filter?.rsql) {
        case "managedAttributeComponent==MATERIAL_SAMPLE":
          return {
            data: [
              {
                id: "0192ba73-340a-72b1-bea9-fc75cdcaf7c6",
                type: "managed-attribute",
                name: "my test managed attribute",
                key: "my_test_managed_attribute",
                vocabularyElementType: "STRING",
                unit: null,
                managedAttributeComponent: "MATERIAL_SAMPLE",
                acceptedValues: null,
                createdOn: "2024-10-23T17:36:05.296422Z",
                createdBy: "dina-admin",
                group: "aafc",
                multilingualDescription: {
                  descriptions: []
                }
              }
            ]
          };
        case "managedAttributeComponent==PREPARATION":
          return {
            data: [
              {
                id: "0192e83f-e198-7fd8-b7e9-d7a24e11c683",
                type: "managed-attribute",
                name: "Test Preparation Managed Attribute",
                key: "test_preparation_managed_attribute",
                vocabularyElementType: "STRING",
                unit: null,
                managedAttributeComponent: "PREPARATION",
                acceptedValues: null,
                createdOn: "2024-10-23T17:36:05.296422Z",
                createdBy: "dina-admin",
                group: "aafc",
                multilingualDescription: {
                  descriptions: []
                }
              }
            ]
          };
        case "managedAttributeComponent==COLLECTING_EVENT":
          return {
            data: [
              {
                id: "0679a2cd-80e8-4fc7-bcfa-ca13e0892354",
                type: "managed-attribute",
                name: "Test Collecting Event Managed Attribute",
                key: "test_collecting_event_managed_attribute",
                vocabularyElementType: "STRING",
                unit: null,
                managedAttributeComponent: "COLLECTING_EVENT",
                acceptedValues: null,
                createdOn: "2024-10-23T17:36:05.296422Z",
                createdBy: "dina-admin",
                group: "aafc",
                multilingualDescription: {
                  descriptions: []
                }
              }
            ]
          };
      }
  }
});

const apiContext: any = {
  apiClient: { get: mockGet, axios: { post: mockPost } }
};

describe("Workbook Template Generator", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Page Layout", async () => {
    // Generates a snapshot of the generator page. This is used to ensure the design of the page
    // does not change unless intented.
    const wrapper = mountWithAppContext2(<WorkbookTemplateGenerator />, {
      apiContext
    });

    expect(wrapper.asFragment()).toMatchSnapshot();
  });

  it("Select multiple columns and set aliases", async () => {
    const wrapper = mountWithAppContext2(<WorkbookTemplateGenerator />, {
      apiContext
    });

    // Click the "Add new column" dropdown
    userEvent.click(wrapper.getByRole("combobox"));
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
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

    // Select a relationship level field, and give it an alias.
    userEvent.click(wrapper.getByRole("combobox"));
    userEvent.click(
      wrapper.getAllByRole("option", {
        name: /additional collection number/i
      })[0]
    );
    userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await new Promise(setImmediate);
    userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Coll number"
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
            aliases: ["Sample Name", "Bar code", "Coll number"],
            columns: [
              "materialSampleName",
              "barcode",
              "collectingEvent.otherRecordNumbers"
            ]
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

  it("Delete and moving functionality in the generator", async () => {
    const wrapper = mountWithAppContext2(<WorkbookTemplateGenerator />, {
      apiContext
    });

    // Click the "Add new column" dropdown
    userEvent.click(wrapper.getByRole("combobox"));
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
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

    // Select a relationship level field, and give it an alias.
    userEvent.click(wrapper.getByRole("combobox"));
    userEvent.click(
      wrapper.getAllByRole("option", {
        name: /additional collection number/i
      })[0]
    );
    userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await new Promise(setImmediate);
    userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Coll number"
    );

    // Remove the "Barcode" field.
    userEvent.click(wrapper.getAllByTestId("delete-button")[1]);

    // Move the material sample name down.
    userEvent.click(wrapper.getAllByTestId("move-up-button")[1]);

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
            aliases: ["Coll number", "Sample Name"],
            columns: [
              "collectingEvent.otherRecordNumbers",
              "materialSampleName"
            ]
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
    await new Promise(setImmediate);

    // Click the "Add new column" dropdown
    userEvent.click(wrapper.getByRole("combobox"));
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
    });

    // Select "Primary ID"
    userEvent.click(wrapper.getAllByRole("option", { name: /primary id/i })[0]);
    userEvent.click(wrapper.getAllByRole("button", { name: /add column/i })[0]);
    await new Promise(setImmediate);

    // Select "Barcode"
    userEvent.click(wrapper.getByRole("combobox"));
    userEvent.click(wrapper.getByRole("option", { name: /barcode/i }));
    userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await new Promise(setImmediate);

    // Select a relationship level field
    userEvent.click(wrapper.getByRole("combobox"));
    userEvent.click(
      wrapper.getAllByRole("option", { name: /collection number/i })[1]
    );
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
            columns: [
              "materialSampleName",
              "barcode",
              "collectingEvent.otherRecordNumbers"
            ]
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

  it("Selected managed attribute fields and generate template", async () => {
    const wrapper = mountWithAppContext2(<WorkbookTemplateGenerator />, {
      apiContext
    });
    await new Promise(setImmediate);

    // Click the "Add new column" dropdown
    userEvent.click(wrapper.getByRole("combobox"));
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
    });

    // Select "Material Sample Managed Attributes".
    userEvent.click(
      wrapper.getAllByRole("option", {
        name: /managed attributes/i
      })[0]
    );
    await new Promise(setImmediate);

    // Select a managed attribute to generate.
    userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await new Promise(setImmediate);
    userEvent.click(
      wrapper.getByRole("option", { name: /my test managed attribute/i })
    );
    userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await new Promise(setImmediate);
    userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Managed Attribute Alias"
    );

    // Click the "Add new column" dropdown
    userEvent.click(wrapper.getByRole("combobox"));
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
    });

    // Select "Preparation Managed Attributes".
    userEvent.click(
      wrapper.getAllByRole("option", {
        name: /preparation managed attributes/i
      })[0]
    );
    await new Promise(setImmediate);

    // Select a managed attribute to generate.
    userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await new Promise(setImmediate);
    userEvent.click(
      wrapper.getByRole("option", {
        name: /test preparation managed attribute/i
      })
    );
    userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await new Promise(setImmediate);
    userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Another Managed Attribute"
    );

    // Click the "Add new column" dropdown
    userEvent.click(wrapper.getByRole("combobox"));
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
    });

    // Select "Collecting Event" managed attribute
    userEvent.click(
      wrapper.getAllByRole("option", {
        name: /managed attributes/i
      })[2]
    );
    await new Promise(setImmediate);

    // Select a managed attribute to generate.
    userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await new Promise(setImmediate);
    userEvent.click(
      wrapper.getByRole("option", {
        name: /test collecting event managed attribute/i
      })
    );
    userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await new Promise(setImmediate);

    // Generate the template.
    userEvent.click(
      wrapper.getByRole("button", { name: /generate template/i })
    );
    await new Promise(setImmediate);
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
    expect(mockPost).toHaveBeenCalledWith(
      "objectstore-api/workbook/generation",
      {
        data: {
          attributes: {
            aliases: [
              "Managed Attribute Alias",
              "Another Managed Attribute",
              // No alias was defined, so the column path is used as expected:
              "collectingEvent.managedAttributes.test_collecting_event_managed_attribute"
            ],
            columns: [
              "managedAttributes.my_test_managed_attribute",
              "preparationManagedAttributes.test_preparation_managed_attribute",
              "collectingEvent.managedAttributes.test_collecting_event_managed_attribute"
            ]
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
    await new Promise(setImmediate);

    // Click the "Add new column" dropdown
    userEvent.click(wrapper.getByRole("combobox"));
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
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
