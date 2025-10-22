import { DinaForm, waitForLoadingToDisappear } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { ExistingAttachmentsTable } from "../ExistingAttachmentsTable";
import { waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ResourceIdentifierObject } from "jsonapi-typescript";
import userEvent from "@testing-library/user-event";

const METADATA_FILES: ResourceIdentifierObject[] = [
  {
    id: "00000000-0000-0000-0000-000000000000",
    type: "metadata"
  },
  {
    id: "11111111-1111-1111-1111-111111111111",
    type: "metadata"
  }
];

const mockBulkGet = jest.fn(async (paths) => {
  if (paths.length === 0) {
    return [];
  }

  return paths.map((path: string) => {
    switch (path) {
      case "metadata/00000000-0000-0000-0000-000000000000?include=derivatives":
        return {
          id: "00000000-0000-0000-0000-000000000000",
          type: "metadata",
          originalFilename: "test-file-1.png",
          fileName: "test-file-1.png",
          acMetadataCreator: {
            id: "00000000-0000-0000-0000-000000000000",
            type: "agent",
            displayName: "Mat Poff"
          }
        };
      case "metadata/11111111-1111-1111-1111-111111111111?include=derivatives":
        return {
          id: "11111111-1111-1111-1111-111111111111",
          originalFilename: "test-file-2.png",
          fileName: "test-file-2.png",
          type: "metadata"
        };
      case "person/00000000-0000-0000-0000-000000000000":
        return {
          id: "00000000-0000-0000-0000-000000000000",
          type: "agent",
          displayName: "Mat Poff"
        };
    }
  });
});

const mockSave = jest.fn(() => {
  return [
    {
      id: "11111111-1111-1111-1111-111111111111",
      dcType: "TEXT",
      createdBy: "dina-admin",
      createdOn: "2024-11-04T20:39:06.256239Z",
      originalFileName: "test-file-2.png",
      filename: "test-file-2.png",
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

const mockGet = jest.fn(async (path) => {
  if (
    path === "objectstore-api/metadata/11111111-1111-1111-1111-111111111111"
  ) {
    return {
      data: {
        id: "11111111-1111-1111-1111-111111111111",
        dcType: "TEXT",
        createdBy: "dina-admin",
        createdOn: "2024-11-04T20:39:06.256239Z",
        originalFileName: "test-file-2.png",
        filename: "test-file-2.png",
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
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <ExistingAttachmentsTable
          metadatas={METADATA_FILES}
          onDetachMetadataIds={mockOnDetachMetadataIds}
          onMetadatasEdited={mockOnMetadatasEdited}
        />
      </DinaForm>,
      { apiContext }
    );
    await waitForLoadingToDisappear();

    // Wait for the data to render in the ReactTable component.
    await waitFor(() => {
      const rows = wrapper.container.querySelectorAll(".ReactTable tbody tr");
      expect(rows).toHaveLength(2);

      expect(
        wrapper.getByRole("link", { name: "test-file-1.png" })
      ).toBeInTheDocument();
      expect(
        wrapper.getByRole("link", { name: "test-file-2.png" })
      ).toBeInTheDocument();
    });
  });

  it("Lets you bulk edit attachment Metadatas.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <ExistingAttachmentsTable
          metadatas={METADATA_FILES}
          onDetachMetadataIds={mockOnDetachMetadataIds}
          onMetadatasEdited={mockOnMetadatasEdited}
        />
      </DinaForm>,
      { apiContext }
    );
    await waitForLoadingToDisappear();

    // Wait for the data to render in the ReactTable component.
    await waitFor(() => {
      const rows = wrapper.container.querySelectorAll(".ReactTable tbody tr");
      expect(rows).toHaveLength(2);

      expect(
        wrapper.getByRole("link", { name: "test-file-1.png" })
      ).toBeInTheDocument();
      expect(
        wrapper.getByRole("link", { name: "test-file-2.png" })
      ).toBeInTheDocument();
    });

    // Select row 2.
    const checkbox2 = wrapper.getByTestId(
      "checkbox-11111111-1111-1111-1111-111111111111"
    );
    userEvent.click(checkbox2);

    // Click bulk Edit button to bring up modal
    userEvent.click(
      wrapper.getByRole("button", {
        name: /edit selected attachment metadata/i
      })
    );
    await waitForLoadingToDisappear();

    // Click the Save All button in the modal
    await waitFor(() => {
      expect(
        wrapper.getByRole("button", {
          name: /save all/i
        })
      ).toBeInTheDocument();
    });
    userEvent.click(
      wrapper.getByRole("button", {
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
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <ExistingAttachmentsTable
          metadatas={METADATA_FILES}
          onDetachMetadataIds={mockOnDetachMetadataIds}
          onMetadatasEdited={mockOnMetadatasEdited}
        />
      </DinaForm>,
      { apiContext }
    );
    await waitForLoadingToDisappear();

    // Wait for the data to render in the ReactTable component.
    await waitFor(() => {
      const rows = wrapper.container.querySelectorAll(".ReactTable tbody tr");
      expect(rows).toHaveLength(2);

      expect(
        wrapper.getByRole("link", { name: "test-file-1.png" })
      ).toBeInTheDocument();
      expect(
        wrapper.getByRole("link", { name: "test-file-2.png" })
      ).toBeInTheDocument();
    });

    // Select row 1.
    const checkbox1 = wrapper.getByTestId(
      "checkbox-00000000-0000-0000-0000-000000000000"
    );
    userEvent.click(checkbox1);

    // Click detach button
    userEvent.click(
      wrapper.getByRole("button", {
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
