import { waitFor } from "@testing-library/react";
import { WorkbookTemplateGenerator } from "../../../pages/workbook/generator";
import { mountWithAppContext } from "common-ui";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import {
  TEST_CLASSIFICATIONS,
  TEST_MANAGED_ATTRIBUTE_COLLECTING_EVENT,
  TEST_MANAGED_ATTRIBUTE_MATERIAL_SAMPLE,
  TEST_MANAGED_ATTRIBUTE_PREPARATION
} from "../__mocks__/generator.mock";
import { startCase } from "lodash";

const mockPost = jest.fn();

const mockGet = jest.fn<any, any>(async (path, options) => {
  switch (path) {
    case "collection-api/managed-attribute":
      switch (options?.filter?.rsql) {
        case "managedAttributeComponent==MATERIAL_SAMPLE":
          return { data: [TEST_MANAGED_ATTRIBUTE_MATERIAL_SAMPLE] };
        case "managedAttributeComponent==PREPARATION":
          return { data: [TEST_MANAGED_ATTRIBUTE_PREPARATION] };
        case "managedAttributeComponent==COLLECTING_EVENT":
          return { data: [TEST_MANAGED_ATTRIBUTE_COLLECTING_EVENT] };
      }
    case "collection-api/vocabulary2/taxonomicRank":
      return { data: TEST_CLASSIFICATIONS };
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
    const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
      apiContext
    });

    expect(wrapper.asFragment()).toMatchSnapshot();
  });

  it("Select multiple columns and set aliases", async () => {
    const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
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
    userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Sample Name"
    );

    // Select "Barcode", give it alias of "Bar code"
    userEvent.click(wrapper.getByRole("combobox"));
    userEvent.click(wrapper.getByRole("option", { name: /barcode/i }));
    userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
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
    const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
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
    const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
      apiContext
    });

    // Click the "Add new column" dropdown
    userEvent.click(wrapper.getByRole("combobox"));
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
    });

    // Select "Primary ID"
    userEvent.click(wrapper.getAllByRole("option", { name: /primary id/i })[0]);
    userEvent.click(wrapper.getAllByRole("button", { name: /add column/i })[0]);

    // Select "Barcode"
    userEvent.click(wrapper.getByRole("combobox"));
    userEvent.click(wrapper.getByRole("option", { name: /barcode/i }));
    userEvent.click(wrapper.getByRole("button", { name: /add column/i }));

    // Select a relationship level field
    userEvent.click(wrapper.getByRole("combobox"));
    userEvent.click(
      wrapper.getAllByRole("option", { name: /collection number/i })[1]
    );
    userEvent.click(wrapper.getByRole("button", { name: /add column/i }));

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
            ],
            aliases: [
              "Primary ID",
              "Barcode",
              "Collecting Event Additional Collection Numbers"
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
    const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
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
            aliases: [
              "Managed Attribute Alias",
              "Another Managed Attribute",
              // No alias was defined, so the column label is used instead:
              "Test Collecting Event Managed Attribute"
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

  it("Selected scientificNameClassification fields and generate template", async () => {
    const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
      apiContext
    });
    await new Promise(setImmediate);

    // Go through all the possible classifications from the mock.
    for (const element of TEST_CLASSIFICATIONS.vocabularyElements as any) {
      // Click the "Add new column" dropdown
      userEvent.click(wrapper.getByRole("combobox"));
      await waitFor(() => {
        // Total number of options expected based on the dynamic config and index map returned.
        expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
      });

      // Click the "Scientific Name Details" option.
      userEvent.click(
        wrapper.getByRole("option", {
          name: /scientific name details/i
        })
      );
      await new Promise(setImmediate);

      // A new dropdown should appear:
      expect(
        wrapper.getByText(/select classification rank\.\.\./i)
      ).toBeInTheDocument();
      userEvent.click(wrapper.getAllByRole("combobox")[1]);

      // Select classification name.
      userEvent.click(
        wrapper.getByRole("option", { name: startCase(element.name) })
      );

      // Add the column.
      userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    }

    // Change one of the headers to make sure the alias is kept.
    userEvent.type(wrapper.getByPlaceholderText(/kingdom/i), "Kingdom Test");

    // Generate the template.
    userEvent.click(
      wrapper.getByRole("button", { name: /generate template/i })
    );
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    // Ensure the request is correct.
    expect(mockPost).toHaveBeenCalledWith(
      "objectstore-api/workbook/generation",
      {
        data: {
          attributes: {
            aliases: [
              "Kingdom Test",
              "Phylum",
              "Class",
              "Order",
              "Family",
              "Genus",
              "Species",
              "Subspecies",
              "Variety"
            ],
            columns: [
              "Kingdom",
              "Phylum",
              "Class",
              "Order",
              "Family",
              "Genus",
              "Species",
              "Subspecies",
              "Variety"
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
    const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
      apiContext
    });

    const templateNameInput = wrapper
      .getAllByRole("textbox")
      .at(0) as HTMLElement;

    // Put an invalid template name
    userEvent.type(templateNameInput, "Test.xlsx");

    // Click the "Add new column" dropdown
    userEvent.click(wrapper.getByRole("combobox"));
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
    });

    // Select "Primary ID", give it alias of "Sample Name"
    userEvent.click(wrapper.getAllByRole("option", { name: /primary id/i })[0]);
    userEvent.click(wrapper.getAllByRole("button", { name: /add column/i })[0]);

    // After setting a column, the filename should still be there.
    expect(templateNameInput).toHaveDisplayValue("Test.xlsx");

    mockPost.mockReturnValue("pretendFileData");
    userEvent.click(
      wrapper.getByRole("button", { name: /generate template/i })
    );

    // Error should be displayed on the page.
    expect(
      wrapper.getByText(
        /please enter a valid filename\. only letters, numbers, spaces, hyphens, and underscores are allowed\./i
      )
    ).toBeInTheDocument();

    // Ensure the name is still displayed for the user to correct it.
    expect(templateNameInput).toHaveDisplayValue("Test.xlsx");
  });
});
