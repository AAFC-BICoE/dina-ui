import { DinaForm } from "common-ui";
import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "common-ui";
import { Metadata } from "../../../../types/objectstore-api";
import { AttachmentsField } from "../AttachmentsField";
import { screen, fireEvent } from "@testing-library/react";
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
  }
});

const apiContext = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet
};

const testCtx = { apiContext };

const mockOnSubmit = jest.fn<any, any>();

describe("AttachmentsField component", () => {
  beforeEach(jest.clearAllMocks);

  it("Adds the selected Metadatas to the array.", async () => {
    const { container, getByRole, waitForRequests } = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <AttachmentsField
          name="attachment"
          allowNewFieldName="attachmentsConfig.allowNew"
          allowExistingFieldName="attachmentsConfig.allowExisting"
          attachmentPath={`collection-api/collecting-event/100/attachment`}
        />
      </DinaForm>,
      testCtx
    );

    await waitForRequests();

    // Initially empty:
    expect(container.querySelectorAll("tbody tr").length).toEqual(0);

    // Add some attachments:
    const addButton = getByRole("button", { name: /add attachments/i });
    fireEvent.click(addButton);

    await waitForRequests();

    fireEvent.click(
      screen.getByRole("tab", {
        name: /attach existing objects/i
      })
    );
    await waitForRequests();

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

    await waitForRequests();

    // The Metadatas should have been added:
    expect(container.querySelectorAll("tbody tr").length).toEqual(2);

    // Submit the form
    const form = container.querySelector("form");
    if (form) {
      fireEvent.submit(form);
    }

    await waitForRequests();

    // Check the mockOnSubmit was called with the correct values
    expect(mockOnSubmit).toHaveBeenLastCalledWith({
      attachment: [
        { id: "1", type: "metadata" },
        { id: "2", type: "metadata" }
      ]
    });
  });

  it("Prevents duplicate attachments from being attached.", async () => {
    const { container, getByRole, waitForRequests } = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <AttachmentsField
          name="attachment"
          allowNewFieldName="attachmentsConfig.allowNew"
          allowExistingFieldName="attachmentsConfig.allowExisting"
          attachmentPath={`collection-api/collecting-event/100/attachment`}
        />
      </DinaForm>,
      testCtx
    );

    await waitForRequests();

    // Initially empty:
    expect(container.querySelectorAll("tbody tr").length).toEqual(0);

    // Add some attachments:
    const addButton = getByRole("button", { name: /add attachments/i });
    fireEvent.click(addButton);

    await waitForRequests();

    fireEvent.click(
      screen.getByRole("tab", {
        name: /attach existing objects/i
      })
    );
    await waitForRequests();

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

    await waitForRequests();

    fireEvent.click(
      screen.getByRole("button", {
        name: /add attachments/i
      })
    );

    await waitForRequests();

    // Add metadatas again
    fireEvent.click(
      screen.getByRole("tab", {
        name: /attach existing objects/i
      })
    );
    await waitForRequests();

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

    await waitForRequests();

    // The Metadatas should have been added:
    expect(container.querySelectorAll("tbody tr").length).toEqual(2);

    // Submit the form
    const form = container.querySelector("form");
    if (form) {
      fireEvent.submit(form);
    }

    await waitForRequests();

    // Check the mockOnSubmit was called with the correct values
    expect(mockOnSubmit).toHaveBeenLastCalledWith({
      attachment: [
        { id: "1", type: "metadata" },
        { id: "2", type: "metadata" }
      ]
    });
  });

  it("Removes selected Metadatas from the array.", async () => {
    const { container, waitForRequests } = mountWithAppContext(
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
          attachmentPath={`collection-api/collecting-event/100/attachment`}
        />
      </DinaForm>,
      testCtx
    );

    await waitForRequests();

    expect(container.querySelectorAll("tbody tr").length).toEqual(2);

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(removeButtons[0]);

    await waitForRequests();

    expect(container.querySelectorAll("tbody tr").length).toEqual(1);

    // Submit the form
    const form = container.querySelector("form");
    if (form) {
      fireEvent.submit(form);
    }

    await waitForRequests();

    expect(mockOnSubmit).toHaveBeenLastCalledWith({
      attachment: [{ id: "example-2", type: "metadata" }]
    });
  });
});
