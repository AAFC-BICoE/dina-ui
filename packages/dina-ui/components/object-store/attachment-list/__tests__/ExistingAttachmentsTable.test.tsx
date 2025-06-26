import { DinaForm } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { ExistingAttachmentsTable } from "../ExistingAttachmentsTable";
import { screen, fireEvent, within, waitFor } from "@testing-library/react";
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
  } else if (
    path === "objectstore-api/metadata/11111111-1111-1111-1111-111111111111"
  ) {
    return {
      data: {
        id: "11111111-1111-1111-1111-111111111111",
        dcType: "TEXT",
        createdBy: "dina-admin",
        createdOn: "2024-11-04T20:39:06.256239Z",
        originalFileName: "test-file-2.png",
        type: "metadata",
        sha1Hex: "5bc8b250dea269fae9f4abab7ddec787aceff4c3",
        receivedMediaType: "application/pdf",
        detectedMediaType: "application/pdf",
        detectedFileExtension: ".pdf",
        evaluatedMediaType: "application/pdf",
        evaluatedFileExtension: ".pdf",
        sizeInBytes: 331053,
        bucket: "aafc",
        dateTimeDigitized: null,
        exif: {},
        isDerivative: false
      }
    };
  } else {
    return { data: [] };
  }
});

const mockSave = jest.fn(() => {
  return [
    {
      id: "11111111-1111-1111-1111-111111111111",
      dcType: "TEXT",
      createdBy: "dina-admin",
      createdOn: "2024-11-04T20:39:06.256239Z",
      originalFileName: "test-file-2.png",
      type: "metadata",
      sha1Hex: "5bc8b250dea269fae9f4abab7ddec787aceff4c3",
      receivedMediaType: "application/pdf",
      detectedMediaType: "application/pdf",
      detectedFileExtension: ".pdf",
      evaluatedMediaType: "application/pdf",
      evaluatedFileExtension: ".pdf",
      sizeInBytes: 331053,
      bucket: "aafc",
      dateTimeDigitized: null,
      exif: {},
      isDerivative: false
    }
  ];
});

const apiContext: any = {
  apiClient: {
    get: mockGet
  },
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
    const { container } = mountWithAppContext(
      <ExistingAttachmentsTable
        attachmentPath="collection-api/collecting-event/00000000-0000-0000-0000-000000000000/attachment"
        onDetachMetadataIds={mockOnDetachMetadataIds}
        onMetadatasEdited={mockOnMetadatasEdited}
      />,
      { apiContext }
    );

    // Wait for the data to render in the ReactTable component.
    await waitFor(() => {
      const rows = container.querySelectorAll(".ReactTable tbody tr");
      expect(rows).toHaveLength(2);

      expect(screen.getByAltText("test-file-1.png")).toBeInTheDocument();
      expect(screen.getByAltText("test-file-2.png")).toBeInTheDocument();
    });
  });

  it("Lets you bulk edit attachment Metadatas.", async () => {
    mountWithAppContext(
      <DinaForm initialValues={{}}>
        <ExistingAttachmentsTable
          attachmentPath="collection-api/collecting-event/00000000-0000-0000-0000-000000000000/attachment"
          onDetachMetadataIds={mockOnDetachMetadataIds}
          onMetadatasEdited={mockOnMetadatasEdited}
        />
      </DinaForm>,
      { apiContext }
    );

    // Get row 2
    await waitFor(
      () => {
        expect(
          screen.getByRole("row", {
            name: /select test\-file\-2\.png/i
          })
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Click row 2 checkbox
    const checkbox = within(
      screen.getByRole("row", {
        name: /select test\-file\-2\.png/i
      })
    ).getByRole("checkbox", {
      name: /select/i
    });
    fireEvent.click(checkbox);

    // Click bulk Edit button to bring up modal
    fireEvent.click(
      screen.getByRole("button", {
        name: /edit selected attachment metadata/i
      })
    );

    // Click the Save All button in the modal
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: /save all/i
        })
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: /save all/i
      })
    );

    // The bulk editor should call our mock:
    await waitFor(() => {
      expect(mockOnMetadatasEdited).lastCalledWith([
        "11111111-1111-1111-1111-111111111111"
      ]);
    });
  });

  it("Lets you detach attachment Metadatas.", async () => {
    mountWithAppContext(
      <ExistingAttachmentsTable
        attachmentPath="collection-api/collecting-event/00000000-0000-0000-0000-000000000000/attachment"
        onDetachMetadataIds={mockOnDetachMetadataIds}
        onMetadatasEdited={mockOnMetadatasEdited}
      />,
      { apiContext }
    );

    // Get row 1
    await waitFor(() => {
      expect(
        screen.getByRole("row", {
          name: /select test\-file\-1\.png/i
        })
      ).toBeInTheDocument();
    });

    // Click row 1 checkbox
    const checkbox = within(
      screen.getByRole("row", {
        name: /select test\-file\-1\.png/i
      })
    ).getByRole("checkbox", {
      name: /select/i
    });
    fireEvent.click(checkbox);

    // Click detach button
    fireEvent.click(
      screen.getByRole("button", {
        name: /detach selected/i
      })
    );

    await waitFor(() => {
      expect(mockOnDetachMetadataIds).lastCalledWith([
        "00000000-0000-0000-0000-000000000000"
      ]);
    });
  });
});
