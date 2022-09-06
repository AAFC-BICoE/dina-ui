import { FormikButton } from "common-ui";
import { ExistingMetadataBulkEditor } from "../../../bulk-metadata/ExistingMetadataBulkEditor";
import ReactTable from "react-table";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { ExistingAttachmentsTable } from "../ExistingAttachmentsTable";

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

    // Renders the data into ReactTable:
    expect(wrapper.find(ReactTable).prop("data")).toEqual([
      {
        id: "00000000-0000-0000-0000-000000000000",
        metadata: {
          acMetadataCreator: {
            displayName: "Mat Poff",
            id: "00000000-0000-0000-0000-000000000000",
            type: "agent"
          },
          id: "00000000-0000-0000-0000-000000000000",
          originalFileName: "test-file-1.png",
          type: "metadata"
        },
        type: "metadata"
      },
      {
        id: "11111111-1111-1111-1111-111111111111",
        metadata: {
          id: "11111111-1111-1111-1111-111111111111",
          originalFileName: "test-file-2.png",
          type: "metadata"
        },
        type: "metadata"
      }
    ]);
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
