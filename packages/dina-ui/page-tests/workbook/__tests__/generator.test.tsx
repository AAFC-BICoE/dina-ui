import { waitFor } from "@testing-library/react";
import {
  WorkbookTemplateGenerator,
  buildMaterialSampleGeneratorDynamicConfig
} from "../../../pages/workbook/generator";
import { mountWithAppContext } from "common-ui";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import {
  TEST_CLASSIFICATIONS,
  TEST_CONTROLLED_VOCABULARY_ITEM_COLLECTING_EVENT,
  TEST_CONTROLLED_VOCABULARY_ITEM_MATERIAL_SAMPLE,
  TEST_CONTROLLED_VOCABULARY_ITEM_PREPARATION
} from "../__mocks__/generator.mock";
import _ from "lodash";

const mockPost = jest.fn();

const mockGet = jest.fn<any, any>(async (path, options) => {
  switch (path) {
    case "collection-api/controlled-vocabulary-item":
      switch (options?.filter?.dinaComponent?.EQ) {
        case "MATERIAL_SAMPLE":
          return { data: [TEST_CONTROLLED_VOCABULARY_ITEM_MATERIAL_SAMPLE] };
        case "PREPARATION":
          return { data: [TEST_CONTROLLED_VOCABULARY_ITEM_PREPARATION] };
        case "COLLECTING_EVENT":
          return { data: [TEST_CONTROLLED_VOCABULARY_ITEM_COLLECTING_EVENT] };
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

  it("filters overridden material-sample managed attributes from the top-level field list", () => {
    const result = buildMaterialSampleGeneratorDynamicConfig(
      {
        fields: [
          {
            label: "targetIdentifiableEntitySummary.managedAttributes",
            type: "managedAttribute",
            path: "data.attributes.targetIdentifiableEntitySummary.managedAttributes"
          },
          {
            label:
              "targetIdentifiableEntitySummary.primaryDetermination.managedAttributes",
            type: "managedAttribute",
            path: "data.attributes.targetIdentifiableEntitySummary.primaryDetermination.managedAttributes"
          },
          {
            label: "materialSampleName",
            type: "unsupported",
            path: "data.attributes.materialSampleName"
          }
        ],
        relationshipFields: []
      } as any,
      [
        {
          label: "managedAttributes",
          type: "managedAttribute",
          path: "included.attributes.managedAttributes",
          referencedBy: "organism",
          referencedType: "organism",
          apiEndpoint: "collection-api/managed-attribute"
        }
      ] as any
    );

    expect(result.fields.map((field) => field.label)).toEqual([
      "materialSampleName"
    ]);
    expect(result.relationshipFields).toHaveLength(1);
  });

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
    await userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
    });

    // Select "Primary ID", give it alias of "Sample Name"
    await userEvent.click(
      wrapper.getAllByRole("option", { name: /primary id/i })[0]
    );
    await userEvent.click(
      wrapper.getAllByRole("button", { name: /add column/i })[0]
    );
    await userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Sample Name"
    );

    // Select "Barcode", give it alias of "Bar code"
    await userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await userEvent.click(wrapper.getByRole("option", { name: /barcode/i }));
    await userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Bar code"
    );

    // Select a relationship level field, and give it an alias.
    await userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await userEvent.click(
      wrapper.getAllByRole("option", {
        name: /additional collection number/i
      })[0]
    );
    await userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Coll number"
    );

    // Generate the template.
    await userEvent.click(
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
    await userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
    });

    // Select "Primary ID", give it alias of "Sample Name"
    await userEvent.click(
      wrapper.getAllByRole("option", { name: /primary id/i })[0]
    );
    await userEvent.click(
      wrapper.getAllByRole("button", { name: /add column/i })[0]
    );
    await waitFor(() =>
      expect(wrapper.getAllByRole("textbox").at(-1)).toBeInTheDocument()
    );
    await userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Sample Name"
    );

    // Select "Barcode", give it alias of "Bar code"
    await userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await userEvent.click(wrapper.getByRole("option", { name: /barcode/i }));
    await userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await waitFor(() =>
      expect(wrapper.getAllByRole("textbox").at(-1)).toBeInTheDocument()
    );
    await userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Bar code"
    );

    // Select a relationship level field, and give it an alias.
    await userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await userEvent.click(
      wrapper.getAllByRole("option", {
        name: /additional collection number/i
      })[0]
    );
    await userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await waitFor(() =>
      expect(wrapper.getAllByRole("textbox").at(-1)).toBeInTheDocument()
    );
    await userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Coll number"
    );

    // Remove the "Barcode" field.
    await userEvent.click(wrapper.getAllByTestId("delete-button")[1]);

    // Move the material sample name down.
    await userEvent.click(wrapper.getAllByTestId("move-up-button")[1]);

    // Generate the template.
    await userEvent.click(
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
    await userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
    });

    // Select "Primary ID"
    await userEvent.click(
      wrapper.getAllByRole("option", { name: /primary id/i })[0]
    );
    await userEvent.click(
      wrapper.getAllByRole("button", { name: /add column/i })[0]
    );

    // Select "Barcode"
    await userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await userEvent.click(wrapper.getByRole("option", { name: /barcode/i }));
    await userEvent.click(wrapper.getByRole("button", { name: /add column/i }));

    // Select a relationship level field
    await userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await userEvent.click(
      wrapper.getAllByRole("option", { name: /collection number/i })[1]
    );
    await userEvent.click(wrapper.getByRole("button", { name: /add column/i }));

    // Generate the template.
    await userEvent.click(
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
    await waitFor(() =>
      expect(wrapper.getAllByRole("combobox")[1]).toBeInTheDocument()
    );

    // Click the "Add new column" dropdown
    await userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
    });

    // Select "Material Sample Managed Attributes".
    await userEvent.click(
      wrapper.getAllByRole("option", {
        name: /managed attributes/i
      })[0]
    );
    await waitFor(() =>
      expect(wrapper.getAllByRole("combobox")[2]).toBeInTheDocument()
    );

    // Select a managed attribute to generate.
    await userEvent.click(wrapper.getAllByRole("combobox")[2]);
    await waitFor(() =>
      expect(
        wrapper.getByRole("option", { name: /my test managed attribute/i })
      ).toBeInTheDocument()
    );
    await userEvent.click(
      wrapper.getByRole("option", { name: /my test managed attribute/i })
    );
    await userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Managed Attribute Alias"
    );

    // Click the "Add new column" dropdown
    await userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
    });

    // Select "Preparation Managed Attributes".
    await userEvent.click(
      wrapper.getAllByRole("option", {
        name: /preparation managed attributes/i
      })[0]
    );
    await waitFor(() =>
      expect(wrapper.getAllByRole("combobox")[2]).toBeInTheDocument()
    );

    // Select a managed attribute to generate.
    await userEvent.click(wrapper.getAllByRole("combobox")[2]);
    await waitFor(() =>
      expect(
        wrapper.getByRole("option", {
          name: /test preparation managed attribute/i
        })
      ).toBeInTheDocument()
    );
    await userEvent.click(
      wrapper.getByRole("option", {
        name: /test preparation managed attribute/i
      })
    );
    await userEvent.click(wrapper.getByRole("button", { name: /add column/i }));
    await userEvent.type(
      wrapper.getAllByRole("textbox").at(-1) as HTMLElement,
      "Another Managed Attribute"
    );

    // Click the "Add new column" dropdown
    await userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
    });

    // Select "Collecting Event" managed attribute
    await userEvent.click(
      wrapper.getAllByRole("option", {
        name: /managed attributes/i
      })[2]
    );
    await waitFor(() =>
      expect(wrapper.getAllByRole("combobox")[1]).toBeInTheDocument()
    );

    // Select a managed attribute to generate.
    await userEvent.click(wrapper.getAllByRole("combobox")[2]);
    await waitFor(() =>
      expect(
        wrapper.getByRole("option", {
          name: /test collecting event managed attribute/i
        })
      ).toBeInTheDocument()
    );
    await userEvent.click(
      wrapper.getByRole("option", {
        name: /test collecting event managed attribute/i
      })
    );
    await userEvent.click(wrapper.getByRole("button", { name: /add column/i }));

    // Generate the template.
    await userEvent.click(
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

  it("Selected scientificNameDetails fields and generate template", async () => {
    const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
      apiContext
    });
    await waitFor(() =>
      expect(wrapper.getAllByRole("combobox")[1]).toBeInTheDocument()
    );

    // Go through all the possible classifications from the mock.
    for (const element of TEST_CLASSIFICATIONS.vocabularyElements as any) {
      // Click the "Add new column" dropdown
      await userEvent.click(wrapper.getAllByRole("combobox")[1]);
      await waitFor(() => {
        // Total number of options expected based on the dynamic config and index map returned.
        expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
      });

      // Click the "Scientific Name Classification" option.
      await userEvent.click(
        wrapper.getByRole("option", {
          name: /scientific name classification/i
        })
      );
      await waitFor(() =>
        expect(
          wrapper.getByText(/select classification rank\.\.\./i)
        ).toBeInTheDocument()
      );

      // A new dropdown should appear:
      expect(
        wrapper.getByText(/select classification rank\.\.\./i)
      ).toBeInTheDocument();
      await userEvent.click(wrapper.getAllByRole("combobox")[2]);

      // Select classification name.
      await userEvent.click(
        wrapper.getByRole("option", { name: _.startCase(element.name) })
      );

      // Add the column.
      await userEvent.click(
        wrapper.getByRole("button", { name: /add column/i })
      );
    }

    // Change one of the headers to make sure the alias is kept.
    await userEvent.type(
      wrapper.getByPlaceholderText(/kingdom/i),
      "Kingdom Test"
    );

    // Generate the template.
    await userEvent.click(
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
    await userEvent.type(templateNameInput, "Test.xlsx");

    // Click the "Add new column" dropdown
    await userEvent.click(wrapper.getAllByRole("combobox")[1]);
    await waitFor(() => {
      // Total number of options expected based on the dynamic config and index map returned.
      expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(1);
    });

    // Select "Primary ID", give it alias of "Sample Name"
    await userEvent.click(
      wrapper.getAllByRole("option", { name: /primary id/i })[0]
    );
    await userEvent.click(
      wrapper.getAllByRole("button", { name: /add column/i })[0]
    );

    // After setting a column, the filename should still be there.
    expect(templateNameInput).toHaveDisplayValue("Test.xlsx");

    mockPost.mockReturnValue("pretendFileData");
    await userEvent.click(
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
