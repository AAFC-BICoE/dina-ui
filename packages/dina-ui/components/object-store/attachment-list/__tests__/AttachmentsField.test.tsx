import { DinaForm } from "common-ui";
import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "common-ui";
import { Metadata } from "../../../../types/objectstore-api";
import { AttachmentsField } from "../AttachmentsField";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const MOCK_INDEX_MAPPING_RESP = {
  data: {
    indexName: "dina_object_store_index",
    attributes: [
      {
        name: "originalFilename",
        type: "text",
        path: "data.attributes"
      },
      {
        name: "bucket",
        type: "text",
        path: "data.attributes"
      },
      {
        name: "createdBy",
        type: "text",
        path: "data.attributes"
      },
      {
        name: "acCaption",
        type: "text",
        path: "data.attributes"
      },
      {
        name: "id",
        type: "text",
        path: "data"
      },
      {
        name: "type",
        type: "text",
        path: "data"
      },
      {
        name: "createdOn",
        type: "date",
        path: "data.attributes"
      }
    ],
    relationships: []
  }
};

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
      return MOCK_INDEX_MAPPING_RESP;
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
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: /attach existing objects/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(
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
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /check all/i
      })
    );

    fireEvent.click(
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
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: /attach existing objects/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(
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
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /check all/i
      })
    );

    fireEvent.click(
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
    fireEvent.click(addButton2);

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: /attach existing objects/i })
      ).toBeInTheDocument();
    });

    // Add metadatas again
    fireEvent.click(
      screen.getByRole("tab", {
        name: /attach existing objects/i
      })
    );
    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: /check all/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /check all/i
      })
    );

    fireEvent.click(
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

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(removeButtons[0]);

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
});
