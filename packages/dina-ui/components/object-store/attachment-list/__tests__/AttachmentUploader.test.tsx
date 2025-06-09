import { mountWithAppContext } from "common-ui";
import { AttachmentUploader } from "../AttachmentUploader";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockPost = jest.fn((path) => {
  if (path === "search-api/search-ws/search") {
    return new Promise((resolve) => resolve);
  } else {
    return {
      data: {
        dateTimeDigitized: "2003-12-14T12:01:44",
        fileIdentifier: "c0f78fce-1825-4c4e-89c7-92fe0ed9dc73",
        fileType: "text",
        size: "500"
      }
    };
  }
});
const mockGet = jest.fn((path) => {
  if (path === "objectstore-api/config/default-values") {
    return {
      data: { values: [] }
    };
  } else if (path === "objectstore-api/config/file-upload") {
    return {
      data: {
        id: "file-upload",
        type: "config",
        attributes: {
          "max-request-size": "1000MB",
          "max-file-size": "1000MB"
        }
      }
    };
  }
});
const mockSave = jest.fn((ops) =>
  ops.map((op, index) => ({
    ...op.resource,
    id: String(index)
  }))
);

const mockBulkGet = jest.fn<any, any>(async (paths) => {
  return paths.map((_path: string, index) => ({
    dcType: "TEXT",
    createdBy: "dina-admin",
    createdOn: "2024-11-04T20:39:06.256239Z",
    originalFilename: String(index),
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
    isDerivative: false,
    uuid: String(index)
  }));
});

const apiContext = {
  apiClient: {
    get: mockGet,
    axios: {
      get: mockGet,
      post: mockPost
    }
  },
  save: mockSave,
  bulkGet: mockBulkGet
} as any;

const mockAfterMetadatasSaved = jest.fn();

// Mock scroll for all elements in JSDOM
window.HTMLElement.prototype.scroll = jest.fn();

describe("AttachmentUploader component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Uploads the files and opens the Metadata editor.", async () => {
    mountWithAppContext(
      <AttachmentUploader afterMetadatasSaved={mockAfterMetadatasSaved} />,
      { apiContext }
    );
    // Create mock files similar to what the Dropzone would receive:
    const mockAcceptedFiles = [
      new File(["file content"], "file1.pdf", { type: "application/pdf" }),
      new File(["file content"], "file2.pdf", { type: "application/pdf" }),
      new File(["file content"], "file3.pdf", { type: "application/pdf" })
    ];
    await waitFor(() => {
      expect(
        screen.getByRole("combobox", {
          name: /group select\.\.\./i
        })
      ).toBeInTheDocument();
    });

    // Select group
    fireEvent.mouseDown(
      screen.getByRole("combobox", {
        name: /group select\.\.\./i
      })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("option", {
          name: /aafc/i
        })
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole("option", {
        name: /aafc/i
      })
    );

    // Find the file input in the Dropzone component
    const fileInput = screen.getByLabelText(/drag and drop files here/i);
    await waitFor(() => {
      expect(fileInput).toBeInTheDocument();
    });

    // Mock the `FileList` containing the files:
    Object.defineProperty(fileInput, "files", {
      value: mockAcceptedFiles
    });

    // Simulate the file selection
    fireEvent.change(fileInput);

    // Simulate the save upload
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: /save/i
        })
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: /save/i
      })
    );

    // Should now be at metadata modal
    // Simulate clicking Save All metadata button
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

    // Ensure the afterMetadatasSaved callback was called with the right metadata IDs
    await waitFor(() => {
      expect(mockAfterMetadatasSaved).toHaveBeenCalledWith(["0", "1", "2"]);
    });
  });
});
