import { FormikButton, ReactTable } from "common-ui";
import { mountWithAppContext2 } from "../../../../test-util/mock-app-context";
import { ExistingMetadataBulkEditor } from "../../../bulk-metadata/ExistingMetadataBulkEditor";
import { ExistingAttachmentsTable } from "../ExistingAttachmentsTable";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockBulkGet = jest.fn(async (paths) => {
  if (paths.length === 0) {
    return [];
  }
  if ((paths[0] as string).startsWith("metadata/")) {
    return [
      {
        id: "00000000-0000-0000-0000-000000000000",
        type: "metadata",
        originalFileName: "test-file-1.png",
        acMetadataCreator: {
          id: "00000000-0000-0000-0000-000000000000",
          type: "agent",
          displayName: "Mat Poff"
        }
      },
      {
        id: "11111111-1111-1111-1111-111111111111",
        originalFileName: "test-file-2.png",
        type: "metadata"
      }
    ];
  }
  if ((paths[0] as string).startsWith("person/")) {
    return [
      {
        id: "00000000-0000-0000-0000-000000000000",
        type: "agent",
        displayName: "Mat Poff"
      }
    ];
  }
});

const mockGet = jest.fn(async (path) => {
  if (
    path ===
    "collection-api/collecting-event/00000000-0000-0000-0000-000000000000/attachment"
  ) {
    return {
      data: [
        {
          id: "00000000-0000-0000-0000-000000000000",
          type: "metadata"
        },
        {
          id: "11111111-1111-1111-1111-111111111111",
          type: "metadata"
        }
      ]
    };
  } else {
    return { data: [] };
  }
});

const mockSave = jest.fn();

const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet,
  save: mockSave
};

const mockOnDetachMetadataIds = jest.fn();
const mockOnMetadatasEdited = jest.fn();

describe("ExistingAttachmentsTable component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders the attachments in a table", async () => {
    const { container } = mountWithAppContext2(
      <ExistingAttachmentsTable
        attachmentPath="collection-api/collecting-event/00000000-0000-0000-0000-000000000000/attachment"
        onDetachMetadataIds={mockOnDetachMetadataIds}
        onMetadatasEdited={mockOnMetadatasEdited}
      />,
      { apiContext }
    );

    // Wait for the data to render in the ReactTable component.
    await new Promise(setImmediate);
    const rows = container.querySelectorAll(".ReactTable tbody tr");
    expect(rows).toHaveLength(2);

    expect(screen.getByAltText("test-file-1.png")).toBeInTheDocument();
    expect(screen.getByAltText("test-file-2.png")).toBeInTheDocument();
  });

  it("Lets you bulk edit attachment Metadatas.", async () => {
    const wrapper = mountWithAppContext(
      <ExistingAttachmentsTable
        attachmentPath="collection-api/collecting-event/00000000-0000-0000-0000-000000000000/attachment"
        onDetachMetadataIds={mockOnDetachMetadataIds}
        onMetadatasEdited={mockOnMetadatasEdited}
      />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(FormikButton).first().prop<any>("onClick")({
      selectedMetadatas: { "11111111-1111-1111-1111-111111111111": true }
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Renders the bulk editor with our prop passed in.
    await wrapper.find(ExistingMetadataBulkEditor).prop<any>("onSaved")([
      "11111111-1111-1111-1111-111111111111"
    ]);

    // The bulk editor should call our mock:
    expect(mockOnMetadatasEdited).lastCalledWith([
      "11111111-1111-1111-1111-111111111111"
    ]);
  });

  it("Lets you detach attachment Metadatas.", async () => {
    const wrapper = mountWithAppContext(
      <ExistingAttachmentsTable
        attachmentPath="collection-api/collecting-event/00000000-0000-0000-0000-000000000000/attachment"
        onDetachMetadataIds={mockOnDetachMetadataIds}
        onMetadatasEdited={mockOnMetadatasEdited}
      />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(FormikButton).at(1).prop<any>("onClick")({
      selectedMetadatas: { "00000000-0000-0000-0000-000000000000": true }
    });

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockOnDetachMetadataIds).lastCalledWith([
      "00000000-0000-0000-0000-000000000000"
    ]);
  });
});
