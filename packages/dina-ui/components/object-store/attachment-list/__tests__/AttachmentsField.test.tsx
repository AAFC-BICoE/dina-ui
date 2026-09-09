import { DinaForm, DinaFormSection, OBJECT_STORE_MAPPING } from "common-ui";
import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "common-ui";
import { Metadata } from "../../../../types/objectstore-api";
import { AttachmentsField } from "../AttachmentsField";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const TEST_METADATAS: PersistedResource<Metadata>[] = [
  {
    id: "1",
    type: "metadata",
    originalFilename: "test-file-1",
    bucket: "bucket",
    fileIdentifier: "111"
  },
  {
    id: "2",
    type: "metadata",
    originalFilename: "test-file-2",
    bucket: "bucket",
    fileIdentifier: "222"
  }
];

const mockBulkGet = jest.fn<any, any>(async (paths) => {
  if (paths.length === 0) {
    return [];
  }
  return paths.map((path: string) => ({
    // Return a mock metadata with the supplied ID:
    id: path.replace(/^metadata\//, ""),
    type: "metadata"
  }));
});

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "objectstore-api/metadata":
      return { data: TEST_METADATAS };
    case "search-api/search-ws/mapping":
      return OBJECT_STORE_MAPPING;
  }
});

const TEST_ELASTIC_SEARCH_RESPONSE = {
  data: {
    hits: {
      total: {
        value: 2
      },
      hits: [
        {
          _source: {
            data: {
              id: TEST_METADATAS[0].id,
              type: "metadata",
              attributes: TEST_METADATAS[0]
            }
          }
        },
        {
          _source: {
            data: {
              id: TEST_METADATAS[1].id,
              type: "metadata",
              attributes: TEST_METADATAS[1]
            }
          }
        }
      ]
    }
  }
};

const mockPost = jest.fn<any, any>(async (path) => {
  switch (path) {
    // Elastic search response with object store mock metadata data.
    case "search-api/search-ws/search":
      return TEST_ELASTIC_SEARCH_RESPONSE;
  }
});

const apiContext = {
  apiClient: {
    get: mockGet,
    axios: {
      get: mockGet,
      post: mockPost
    }
  },
  bulkGet: mockBulkGet
};

const testCtx = { apiContext };

const mockOnSubmit = jest.fn<any, any>();

describe("AttachmentsField component", () => {
  beforeEach(jest.clearAllMocks);

  it("Adds the selected Metadatas to the array.", async () => {
    const { container, getByRole } = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <AttachmentsField
          name="attachment"
          allowNewFieldName="attachmentsConfig.allowNew"
          allowExistingFieldName="attachmentsConfig.allowExisting"
        />
      </DinaForm>,
      testCtx as any
    );

    // Initially empty:
    await waitFor(() => {
      expect(container.querySelectorAll("tbody tr").length).toEqual(0);
    });

    // Add some attachments:
    const addButton = await waitFor(() => {
      const button = getByRole("button", { name: /add attachments/i });
      expect(button).toBeInTheDocument();
      return button;
    });
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: /attach existing objects/i })
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("tab", {
        name: /attach existing objects/i
      })
    );
    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: /check all/i })
      ).toBeInTheDocument();
    });

    // Simulate saving the attachments
    await userEvent.click(
      screen.getByRole("checkbox", {
        name: /check all/i
      })
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: /attach selected/i
      })
    );

    // The Metadatas should have been added:
    await waitFor(() => {
      expect(container.querySelectorAll("tbody tr").length).toEqual(2);
    });

    // Submit the form
    const form = container.querySelector("form");
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      // Check the mockOnSubmit was called with the correct values
      expect(mockOnSubmit).toHaveBeenLastCalledWith({
        attachment: [
          { id: "1", type: "metadata" },
          { id: "2", type: "metadata" }
        ]
      });
    });
  });

  it("Prevents duplicate attachments from being attached.", async () => {
    const { container, getByRole } = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <AttachmentsField
          name="attachment"
          allowNewFieldName="attachmentsConfig.allowNew"
          allowExistingFieldName="attachmentsConfig.allowExisting"
        />
      </DinaForm>,
      testCtx as any
    );

    // Initially empty:
    await waitFor(() => {
      expect(container.querySelectorAll("tbody tr").length).toEqual(0);
    });

    // Add some attachments:
    const addButton = await waitFor(() => {
      const button = getByRole("button", { name: /add attachments/i });
      expect(button).toBeInTheDocument();
      return button;
    });
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: /attach existing objects/i })
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("tab", {
        name: /attach existing objects/i
      })
    );
    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: /check all/i })
      ).toBeInTheDocument();
    });

    // Simulate saving the attachments
    await userEvent.click(
      screen.getByRole("checkbox", {
        name: /check all/i
      })
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: /attach selected/i
      })
    );

    await waitFor(() => {
      expect(container.querySelectorAll("tbody tr").length).toEqual(2);
    });

    // Click "Add attachments" again
    const addButton2 = await waitFor(() => {
      const button = getByRole("button", { name: /add attachments/i });
      expect(button).toBeInTheDocument();
      return button;
    });
    await userEvent.click(addButton2);

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: /attach existing objects/i })
      ).toBeInTheDocument();
    });

    // Add metadatas again
    await userEvent.click(
      screen.getByRole("tab", {
        name: /attach existing objects/i
      })
    );
    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: /check all/i })
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("checkbox", {
        name: /check all/i
      })
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: /attach selected/i
      })
    );

    // The Metadatas should have been added:
    await waitFor(() => {
      expect(container.querySelectorAll("tbody tr").length).toEqual(2);
    });

    // Submit the form
    const form = container.querySelector("form");
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      // Check the mockOnSubmit was called with the correct values
      expect(mockOnSubmit).toHaveBeenLastCalledWith({
        attachment: [
          { id: "1", type: "metadata" },
          { id: "2", type: "metadata" }
        ]
      });
    });
  });

  it("Removes selected Metadatas from the array.", async () => {
    const { container } = mountWithAppContext(
      <DinaForm
        initialValues={{
          attachment: [
            { id: "example-1", type: "metadata" },
            { id: "example-2", type: "metadata" }
          ]
        }}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <AttachmentsField
          name="attachment"
          allowNewFieldName="attachmentsConfig.allowNew"
          allowExistingFieldName="attachmentsConfig.allowExisting"
        />
      </DinaForm>,
      testCtx as any
    );

    await waitFor(() => {
      expect(container.querySelectorAll("tbody tr").length).toEqual(2);
    });

    const removeButtons = screen.getAllByRole("button", { name: /unlink/i });
    await userEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(container.querySelectorAll("tbody tr").length).toEqual(1);
    });

    // Submit the form
    const form = container.querySelector("form");
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(mockOnSubmit).lastCalledWith({
        attachment: [{ id: "example-2", type: "metadata" }]
      });
    });
  });

  describe("Form Template mode", () => {
    it("Sets the matching templateCheckboxes entry when 'Allow Existing' is checked (regression test).", async () => {
      const mockSubmit = jest.fn();

      const wrapper = mountWithAppContext(
        <DinaForm
          initialValues={{ attachmentsConfig: {}, templateCheckboxes: {} }}
          isTemplate={true}
          onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
        >
          <DinaFormSection
            componentName="material-sample-attachments-component"
            sectionName="material-sample-attachments-sections"
          >
            <AttachmentsField
              name="attachment"
              allowNewFieldName="attachmentsConfig.allowNew"
              allowExistingFieldName="attachmentsConfig.allowExisting"
            />
          </DinaFormSection>
        </DinaForm>,
        testCtx as any
      );

      await waitFor(() =>
        expect(
          wrapper.container.querySelector("input.allow-existing-checkbox")
        ).toBeInTheDocument()
      );

      await userEvent.click(
        wrapper.container.querySelector("input.allow-existing-checkbox")!
      );

      const form = wrapper.container.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => expect(mockSubmit).toHaveBeenCalled());

      const submitted = mockSubmit.mock.calls[0][0];
      expect(submitted.attachmentsConfig.allowExisting).toEqual(true);
      expect(
        submitted.templateCheckboxes[
          "material-sample-attachments-component.material-sample-attachments-sections.attachmentsConfig.allowExisting"
        ]
      ).toEqual(true);
      // The untouched sibling checkbox's templateCheckboxes entry should not be set:
      expect(
        submitted.templateCheckboxes[
          "material-sample-attachments-component.material-sample-attachments-sections.attachmentsConfig.allowNew"
        ]
      ).toBeUndefined();
    });

    it("Sets the matching templateCheckboxes entry when 'Allow New' is checked (regression test).", async () => {
      const mockSubmit = jest.fn();

      const wrapper = mountWithAppContext(
        <DinaForm
          initialValues={{ attachmentsConfig: {}, templateCheckboxes: {} }}
          isTemplate={true}
          onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
        >
          <DinaFormSection
            componentName="collecting-event-component"
            sectionName="collecting-event-attachments-section"
          >
            <AttachmentsField
              name="attachment"
              allowNewFieldName="attachmentsConfig.allowNew"
              allowExistingFieldName="attachmentsConfig.allowExisting"
            />
          </DinaFormSection>
        </DinaForm>,
        testCtx as any
      );

      await waitFor(() =>
        expect(
          wrapper.container.querySelector("input.allow-new-checkbox")
        ).toBeInTheDocument()
      );

      await userEvent.click(
        wrapper.container.querySelector("input.allow-new-checkbox")!
      );

      const form = wrapper.container.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => expect(mockSubmit).toHaveBeenCalled());

      const submitted = mockSubmit.mock.calls[0][0];
      expect(submitted.attachmentsConfig.allowNew).toEqual(true);
      expect(
        submitted.templateCheckboxes[
          "collecting-event-component.collecting-event-attachments-section.attachmentsConfig.allowNew"
        ]
      ).toEqual(true);
    });

    it("Keeps the templateCheckboxes entry set to true after unchecking 'Allow Existing' back to false", async () => {
      const mockSubmit = jest.fn();

      const wrapper = mountWithAppContext(
        <DinaForm
          initialValues={{ attachmentsConfig: {}, templateCheckboxes: {} }}
          isTemplate={true}
          onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
        >
          <DinaFormSection
            componentName="material-sample-attachments-component"
            sectionName="material-sample-attachments-sections"
          >
            <AttachmentsField
              name="attachment"
              allowNewFieldName="attachmentsConfig.allowNew"
              allowExistingFieldName="attachmentsConfig.allowExisting"
            />
          </DinaFormSection>
        </DinaForm>,
        testCtx as any
      );

      await waitFor(() =>
        expect(
          wrapper.container.querySelector("input.allow-existing-checkbox")
        ).toBeInTheDocument()
      );

      const checkbox = wrapper.container.querySelector(
        "input.allow-existing-checkbox"
      )!;

      // Check it (true), then uncheck it again (explicitly false):
      await userEvent.click(checkbox);
      await userEvent.click(checkbox);

      const form = wrapper.container.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => expect(mockSubmit).toHaveBeenCalled());

      const submitted = mockSubmit.mock.calls[0][0];
      // The field's own value should reflect the explicit "false":
      expect(submitted.attachmentsConfig.allowExisting).toEqual(false);
      // But the field must still be marked as included/visible in the template,
      // otherwise the "false" default value gets discarded when the template is used:
      expect(
        submitted.templateCheckboxes[
          "material-sample-attachments-component.material-sample-attachments-sections.attachmentsConfig.allowExisting"
        ]
      ).toEqual(true);
    });
  });

  describe("Applying a Form Template's Allow New/Allow Existing config", () => {
    it("Hides the 'Attach Existing Objects' tab when the applied Form Template set allowExisting to false (regression test).", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm
          initialValues={{
            attachment: [],
            attachmentsConfig: { allowNew: true, allowExisting: false }
          }}
          onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
        >
          <AttachmentsField
            name="attachment"
            allowNewFieldName="attachmentsConfig.allowNew"
            allowExistingFieldName="attachmentsConfig.allowExisting"
          />
        </DinaForm>,
        testCtx as any
      );

      const addButton = await waitFor(() => {
        const button = wrapper.getByRole("button", {
          name: /add attachments/i
        });
        expect(button).toBeInTheDocument();
        return button;
      });
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByRole("tab", { name: /upload new attachments/i })
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByRole("tab", { name: /attach existing objects/i })
      ).not.toBeInTheDocument();
    });

    it("Hides the 'Upload New Attachments' tab when the applied Form Template set allowNew to false", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm
          initialValues={{
            attachment: [],
            attachmentsConfig: { allowNew: false, allowExisting: true }
          }}
          onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
        >
          <AttachmentsField
            name="attachment"
            allowNewFieldName="attachmentsConfig.allowNew"
            allowExistingFieldName="attachmentsConfig.allowExisting"
          />
        </DinaForm>,
        testCtx as any
      );

      const addButton = await waitFor(() => {
        const button = wrapper.getByRole("button", {
          name: /add attachments/i
        });
        expect(button).toBeInTheDocument();
        return button;
      });
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByRole("tab", { name: /attach existing objects/i })
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByRole("tab", { name: /upload new attachments/i })
      ).not.toBeInTheDocument();
    });

    it("Disables the 'Add Attachments' button when the applied Form Template disallows both new and existing attachments.", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm
          initialValues={{
            attachment: [],
            attachmentsConfig: { allowNew: false, allowExisting: false }
          }}
          onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
        >
          <AttachmentsField
            name="attachment"
            allowNewFieldName="attachmentsConfig.allowNew"
            allowExistingFieldName="attachmentsConfig.allowExisting"
          />
        </DinaForm>,
        testCtx as any
      );

      const addButton = await waitFor(() => {
        const button = wrapper.getByRole("button", {
          name: /add attachments/i
        });
        expect(button).toBeInTheDocument();
        return button;
      });
      expect(addButton).toBeDisabled();
    });
  });
});
