import { waitFor } from "@testing-library/react";
import { WorkbookTemplateGenerator } from "../../../pages/workbook/generator";
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

  it("Page Layout", async () => {
    // Generates a snapshot of the generator page. This is used to ensure the design of the page
    // does not change unless intented.
    const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
      apiContext
    });

    expect(wrapper.asFragment()).toMatchSnapshot();
  });

  describe("Template Generation Functionality", () => {
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
      await userEvent.click(
        wrapper.getByRole("button", { name: /add column/i })
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
      await userEvent.click(
        wrapper.getByRole("button", { name: /add column/i })
      );
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
      await userEvent.click(
        wrapper.getByRole("button", { name: /add column/i })
      );
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
      await userEvent.click(
        wrapper.getByRole("button", { name: /add column/i })
      );
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
      await userEvent.click(
        wrapper.getByRole("button", { name: /add column/i })
      );

      // Select a relationship level field
      await userEvent.click(wrapper.getAllByRole("combobox")[1]);
      await userEvent.click(
        wrapper.getAllByRole("option", { name: /collection number/i })[1]
      );
      await userEvent.click(
        wrapper.getByRole("button", { name: /add column/i })
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
      await userEvent.click(
        wrapper.getByRole("button", { name: /add column/i })
      );
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
      await userEvent.click(
        wrapper.getByRole("button", { name: /add column/i })
      );
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
      await userEvent.click(
        wrapper.getByRole("button", { name: /add column/i })
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
          expect(wrapper.getAllByRole("option").length).toBeGreaterThanOrEqual(
            1
          );
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

  describe("Template Loading Functionality", () => {
    it("Load a valid template", async () => {
      const mockPost = jest.fn();
      const apiContext: any = {
        apiClient: { get: mockGet, axios: { post: mockPost } }
      };

      // Response shape the conversion API returns:
      const conversionResponse = {
        "0": {
          sheetName: "Sheet0",
          originalColumns: ["barcode", "materialSampleName"],
          columnAliases: ["Barcode", "Material Sample Name"],
          rows: [
            {
              rowNumber: 0,
              content: ["Barcode", "Material Sample Name"]
            }
          ]
        }
      };

      mockPost.mockResolvedValue({ data: conversionResponse });

      const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
        apiContext
      });

      // Find the dropzone text (the visible instruction inside the dropzone)
      const dropzoneText = wrapper.getByText(
        /drag and drop a spreadsheet here or click to open browse dialog\./i
      );
      expect(dropzoneText).toBeInTheDocument();

      // Find the hidden input and upload a File
      const fileInput = wrapper.container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      const file = new File(["dummy"], "valid-test-file.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      // Use userEvent to upload (this will trigger the FileDropzone onChange)
      await userEvent.upload(fileInput, file);

      // Wait for the conversion API to be called
      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

      // Verify the conversion call used the correct endpoint
      expect(mockPost).toHaveBeenCalledWith(
        "/objectstore-api/workbook/conversion",
        expect.any(FormData)
      );

      // Now verify the UI updated — success message and mapped columns
      await waitFor(() =>
        expect(
          wrapper.getByText(/Template has been loaded successfully/i)
        ).toBeInTheDocument()
      );

      // Confirm that the template name has been changed.
      expect(wrapper.getByDisplayValue(/valid-test-file/i)).toBeInTheDocument();

      // Confirm the generator selected the barcode column (alias visible)
      expect(wrapper.getByText(/Barcode/i)).toBeInTheDocument();

      // Confirm the generator selected the material sample name column (alias visible)
      expect(wrapper.getByText(/primary id/i)).toBeInTheDocument();
      expect(
        wrapper.getByDisplayValue(/Material Sample Name/i)
      ).toBeInTheDocument();
    });

    it("Load valid template, containing managed attributes, display managed attribute columns", async () => {
      const mockPost = jest.fn();
      const apiContext: any = {
        apiClient: { get: mockGet, axios: { post: mockPost } }
      };

      // Response shape the conversion API returns:
      const conversionResponse = {
        "0": {
          sheetName: "Sheet0",
          originalColumns: [
            "managedAttributes.dnaConcentration",
            "preparationManagedAttributes.preparationName",
            "collectingEvent.managedAttributes.testCollectingEventManagedAttribute"
          ],
          columnAliases: [
            "DNA Concentration",
            "Preparation Name",
            "Test Collecting Event Managed Attribute"
          ],
          rows: [
            {
              rowNumber: 0,
              content: [
                "DNA Concentration",
                "Preparation Name",
                "Test Collecting Event Managed Attribute"
              ]
            }
          ]
        }
      };

      mockPost.mockResolvedValue({ data: conversionResponse });

      const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
        apiContext
      });

      // Find the dropzone text (the visible instruction inside the dropzone)
      const dropzoneText = wrapper.getByText(
        /drag and drop a spreadsheet here or click to open browse dialog\./i
      );
      expect(dropzoneText).toBeInTheDocument();

      // Find the hidden input and upload a File
      const fileInput = wrapper.container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      const file = new File(["dummy"], "valid-test-file.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      // Use userEvent to upload (this will trigger the FileDropzone onChange)
      await userEvent.upload(fileInput, file);

      // Wait for the conversion API to be called
      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

      // Expect the managed attribute aliases to be displayed in the generator.
      await waitFor(() =>
        expect(
          wrapper.getByDisplayValue(/DNA Concentration/i)
        ).toBeInTheDocument()
      );
      expect(
        wrapper.getByDisplayValue(/Preparation Name/i)
      ).toBeInTheDocument();
      expect(
        wrapper.getByDisplayValue(/Test Collecting Event Managed Attribute/i)
      ).toBeInTheDocument();

      // Expect the managed attribute columns to be displayed in the generator.
      expect(wrapper.getByText(/dnaConcentration/i)).toBeInTheDocument();
      expect(wrapper.getByText(/preparationName/i)).toBeInTheDocument();
      expect(
        wrapper.getByText(/testCollectingEventManagedAttribute/i)
      ).toBeInTheDocument();

      // Generate the template.
      await userEvent.click(
        wrapper.getByRole("button", { name: /generate template/i })
      );
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(2);
      });

      // Regenerate the template and ensure the correct columns and aliases are sent to the generation API.
      expect(mockPost).toHaveBeenCalledWith(
        "objectstore-api/workbook/generation",
        {
          data: {
            attributes: {
              aliases: [
                "DNA Concentration",
                "Preparation Name",
                "Test Collecting Event Managed Attribute"
              ],
              columns: [
                "managedAttributes.dnaConcentration",
                "preparationManagedAttributes.preparationName",
                "collectingEvent.managedAttributes.testCollectingEventManagedAttribute"
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

    it("Load valid template, containing classifications, display classification columns", async () => {
      const mockPost = jest.fn();
      const apiContext: any = {
        apiClient: { get: mockGet, axios: { post: mockPost } }
      };

      // Response shape the conversion API returns:
      const classificationColumns =
        TEST_CLASSIFICATIONS?.vocabularyElements?.map(
          (element) => element.name
        ) ?? [];
      const conversionResponse = {
        "0": {
          sheetName: "Sheet0",
          originalColumns: [classificationColumns],
          columnAliases: [classificationColumns],
          rows: [
            {
              rowNumber: 0,
              content: [classificationColumns]
            }
          ]
        }
      };

      mockPost.mockResolvedValue({ data: conversionResponse });

      const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
        apiContext
      });

      // Find the dropzone text (the visible instruction inside the dropzone)
      const dropzoneText = wrapper.getByText(
        /drag and drop a spreadsheet here or click to open browse dialog\./i
      );
      expect(dropzoneText).toBeInTheDocument();

      // Find the hidden input and upload a File
      const fileInput = wrapper.container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      const file = new File(["dummy"], "valid-test-file.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      // Use userEvent to upload (this will trigger the FileDropzone onChange)
      await userEvent.upload(fileInput, file);

      // Wait for the conversion API to be called
      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

      // Expect the classification aliases and columns to be displayed in the generator.
      classificationColumns.forEach((classification) => {
        expect(
          wrapper.getByDisplayValue(new RegExp(classification ?? "", "i"))
        ).toBeInTheDocument();
        expect(
          wrapper.getByText(new RegExp(classification ?? "", "i"))
        ).toBeInTheDocument();
      });

      // Generate the template.
      await userEvent.click(
        wrapper.getByRole("button", { name: /generate template/i })
      );
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(2);
      });

      // Regenerate the template and ensure the correct columns and aliases are sent to the generation API.
      expect(mockPost).toHaveBeenCalledWith(
        "objectstore-api/workbook/generation",
        {
          data: {
            attributes: {
              aliases: classificationColumns,
              columns: classificationColumns
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

    it("Load an valid template, containing invalid columns that don't exist, display warning", async () => {
      const mockPost = jest.fn();
      const apiContext: any = {
        apiClient: { get: mockGet, axios: { post: mockPost } }
      };

      // Response shape the conversion API returns:
      const conversionResponse = {
        "0": {
          sheetName: "Sheet0",
          originalColumns: [
            "dnaConcentration",
            "fakeColumnThatDoesNotExist",
            "barcode"
          ],
          columnAliases: [
            "DNA Concentration",
            "Fake Column That Does Not Exist",
            "Barcode"
          ],
          rows: [
            {
              rowNumber: 0,
              content: [
                "DNA Concentration",
                "Fake Column That Does Not Exist",
                "Barcode"
              ]
            }
          ]
        }
      };

      mockPost.mockResolvedValue({ data: conversionResponse });

      const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
        apiContext
      });

      // Find the dropzone text (the visible instruction inside the dropzone)
      const dropzoneText = wrapper.getByText(
        /drag and drop a spreadsheet here or click to open browse dialog\./i
      );
      expect(dropzoneText).toBeInTheDocument();

      // Find the hidden input and upload a File
      const fileInput = wrapper.container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      const file = new File(["dummy"], "in-valid-test-file.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      // Use userEvent to upload (this will trigger the FileDropzone onChange)
      await userEvent.upload(fileInput, file);

      // Wait for the conversion API to be called
      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

      // Verify the conversion call used the correct endpoint
      expect(mockPost).toHaveBeenCalledWith(
        "/objectstore-api/workbook/conversion",
        expect.any(FormData)
      );

      // Now verify the UI updated — warning message should be displayed
      await waitFor(() =>
        expect(
          wrapper.getByText(
            /the following columns could not be mapped: dnaconcentration, fakecolumnthatdoesnotexist/i
          )
        ).toBeInTheDocument()
      );

      // Confirm that the template name has been changed.
      expect(
        wrapper.getByDisplayValue(/in-valid-test-file/i)
      ).toBeInTheDocument();

      // Confirm the generator selected the barcode column (alias visible)
      expect(wrapper.getByText(/Barcode/i)).toBeInTheDocument();
    });

    it("Load an invalid template, display error", async () => {
      const mockPost = jest.fn();
      const apiContext: any = {
        apiClient: { get: mockGet, axios: { post: mockPost } }
      };

      // Response shape the conversion API returns:
      // Notice no original columns or column aliases are returned, which is invalid.
      const conversionResponse = {
        "0": {
          sheetName: "Sheet0",
          rows: [
            {
              rowNumber: 0,
              content: ["Barcode", "Material Sample Name"]
            }
          ]
        }
      };

      mockPost.mockResolvedValue({ data: conversionResponse });

      const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
        apiContext
      });

      // Find the dropzone text (the visible instruction inside the dropzone)
      const dropzoneText = wrapper.getByText(
        /drag and drop a spreadsheet here or click to open browse dialog\./i
      );
      expect(dropzoneText).toBeInTheDocument();

      // Find the hidden input and upload a File
      const fileInput = wrapper.container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      const file = new File(["dummy"], "invalid-test-file.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      // Use userEvent to upload (this will trigger the FileDropzone onChange)
      await userEvent.upload(fileInput, file);

      // Wait for the conversion API to be called
      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

      // Verify the conversion call used the correct endpoint
      expect(mockPost).toHaveBeenCalledWith(
        "/objectstore-api/workbook/conversion",
        expect.any(FormData)
      );

      // Now verify the UI updated — error
      await waitFor(() => {
        expect(
          wrapper.getByText(
            /the uploaded template is invalid\. please ensure the template is generated from the template generator and has not been modified\./i
          )
        ).toBeInTheDocument();
      });
    });

    it("Load a valid template, then clear it and load another valid template", async () => {
      const mockPost = jest.fn();
      const apiContext: any = {
        apiClient: { get: mockGet, axios: { post: mockPost } }
      };

      // Response shape the conversion API returns:
      const conversionResponse = {
        "0": {
          sheetName: "Sheet0",
          originalColumns: ["barcode", "materialSampleName"],
          columnAliases: ["Barcode", "Material Sample Name"],
          rows: [
            {
              rowNumber: 0,
              content: ["Barcode", "Material Sample Name"]
            }
          ]
        }
      };

      mockPost.mockResolvedValue({ data: conversionResponse });

      const wrapper = mountWithAppContext(<WorkbookTemplateGenerator />, {
        apiContext
      });

      // Find the hidden input and upload a File
      const fileInput = wrapper.container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      const file = new File(["dummy"], "valid-test-file.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      // Use userEvent to upload (this will trigger the FileDropzone onChange)
      await userEvent.upload(fileInput, file);

      // Wait for the conversion API to be called
      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

      // Ensure the material sample name column is selected (alias visible)
      expect(
        wrapper.getByDisplayValue(/Material Sample Name/i)
      ).toBeInTheDocument();

      // Click the clear button.
      await userEvent.click(
        wrapper.getByRole("button", { name: /remove valid\-test\-file\.xlsx/i })
      );

      // Upload section should appear again.
      await waitFor(() => {
        expect(
          wrapper.getByText(
            /drag and drop a spreadsheet here or click to open browse dialog\./i
          )
        ).toBeInTheDocument();
      });
      expect(mockPost).toHaveBeenCalledTimes(1);

      // The dropzone input is recreated after the previous file is removed, so re-query it.
      const fileInputAfterClear = wrapper.container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(fileInputAfterClear).toBeInTheDocument();

      // Generate another mock with different columns to ensure the second upload is processed correctly.
      const conversionResponse2 = {
        "0": {
          sheetName: "Sheet0",
          originalColumns: ["collectingEvent.otherRecordNumbers"],
          columnAliases: ["Collecting Event Additional Collection Numbers"],
          rows: [
            {
              rowNumber: 0,
              content: ["Collecting Event Additional Collection Numbers"]
            }
          ]
        }
      };
      mockPost.mockResolvedValue({ data: conversionResponse2 });

      // Upload another file.
      const file2 = new File(["dummy"], "valid-test-file-2.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      await userEvent.upload(fileInputAfterClear, file2);

      // Wait for the conversion API to be called
      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(2));

      // Now verify the UI updated — success message and mapped columns
      await waitFor(() =>
        expect(
          wrapper.getByText(/Template has been loaded successfully/i)
        ).toBeInTheDocument()
      );

      // Confirm that the template name has been changed.
      expect(
        wrapper.getByDisplayValue(/valid-test-file-2/i)
      ).toBeInTheDocument();

      // Confirm the generator selected the collecting event column (alias visible)
      expect(
        wrapper.getByDisplayValue(
          /Collecting Event Additional Collection Numbers/i
        )
      ).toBeInTheDocument();

      // The previous column from the first upload should no longer be present.
      expect(
        wrapper.queryByDisplayValue(/Material Sample Name/i)
      ).not.toBeInTheDocument();
    });
  });
});
