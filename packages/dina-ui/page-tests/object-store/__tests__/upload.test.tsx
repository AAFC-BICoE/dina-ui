import { AccountContextI, waitForLoadingToDisappear } from "common-ui";
import _ from "lodash";
import { fileUploadErrorHandler } from "../../../components/object-store/file-upload/FileUploadProvider";
import UploadPage, {
  BULK_ADD_IDS_KEY,
  BULK_ADD_FILES_KEY
} from "../../../pages/object-store/upload";
import { mountWithAppContext } from "common-ui";
import { waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

const mockPush = jest.fn();
const mockFormatMessage = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

const MOCK_ACCOUNT_CONTEXT: AccountContextI = {
  agentId: "6ee06232-e801-4cd5-8fc5-127aa14c3ace",
  authenticated: true,
  groupNames: ["example-group"],
  initialized: true,
  login: _.noop,
  logout: _.noop,
  roles: [],
  // Mock for a successful token update.
  getCurrentToken: () => Promise.resolve("test-token"),
  username: "test-user"
};

window.HTMLElement.prototype.scroll = jest.fn();

describe("Upload page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Uploads files when you click the Continue with Batch Entry Form button", async () => {
    // Generate a mock UUID for each file being uploaded.
    const objectUploadUUIDs = [
      "c0f78fce-1825-4c4e-89c7-92fe0ed9dc73",
      "5d02a84b-1dce-44e3-9df2-dd72e0d5b02f",
      "990edfd7-7393-47c5-b195-61583c8ec0ce"
    ];

    let currentUuid = 0;

    const mockPost = jest.fn(() => {
      const id = objectUploadUUIDs[currentUuid++];
      return {
        data: {
          data: {
            id,
            type: "object-upload",
            attributes: {
              dateTimeDigitized: "2003-12-14T12:01:44",
              fileType: "text",
              size: "500",
              originalFilename: `file${currentUuid}.pdf`
            }
          }
        }
      };
    });

    const mockSave = jest.fn((ops) =>
      ops.map((op, index) => ({
        ...op.resource,
        id: String(index)
      }))
    );
    const mockGet = jest.fn((path) => {
      if (path === "user-api/group") {
        return { data: [{ name: "example-group" }] };
      }
      if (path === "objectstore-api/config/file-upload") {
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
    const mockApiCtx = {
      apiClient: {
        get: mockGet,
        axios: {
          get: mockGet,
          post: mockPost
        }
      },
      save: mockSave
    };

    const wrapper = mountWithAppContext(<UploadPage />, {
      accountContext: MOCK_ACCOUNT_CONTEXT,
      apiContext: mockApiCtx as any
    });
    await waitForLoadingToDisappear();

    // Pretend the FileUploader is uploading these files:
    const mockAcceptedFiles = [
      new File(["file content"], "file1.pdf", { type: "application/pdf" }),
      new File(["file content"], "file2.pdf", { type: "application/pdf" }),
      new File(["file content"], "file3.pdf", { type: "application/pdf" })
    ];
    await waitFor(() => {
      expect(
        wrapper.getByText(/drag and drop files here/i)
      ).toBeInTheDocument();
    });

    // Find the file input in the Dropzone component
    const fileInput =
      wrapper.container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    // Simulate the file selection
    await userEvent.upload(fileInput!, mockAcceptedFiles);

    // Await the processing of the file uploads
    await waitFor(() => {
      expect(
        wrapper.getByRole("button", { name: "Continue with Batch Entry Form" })
      ).toBeInTheDocument();
    });

    // Submit
    await userEvent.click(
      wrapper.getByRole("button", { name: "Continue with Batch Entry Form" })
    );

    // The group name should be in the URL:
    await waitFor(() => {
      expect(mockPost).lastCalledWith(
        "/objectstore-api/file/example-group",
        // Form data with the file would go here:
        expect.anything(),
        // Passes in the custom error handler:
        expect.anything()
      );
    });

    // You should get redirected to the bulk edit page with the new metadata IDs.
    expect(mockPush).lastCalledWith({
      pathname: "/object-store/metadata/bulk-edit",
      query: {
        group: "example-group"
      }
    });

    expect(localStorage.getItem(BULK_ADD_IDS_KEY)).toEqual(
      JSON.stringify(objectUploadUUIDs)
    );
  });

  it("Uploads files when you click the Continue with Workbook button", async () => {
    // Generate a mock UUID for each file being uploaded.
    const objectUploadUUIDs = [
      "c0f78fce-1825-4c4e-89c7-92fe0ed9dc73",
      "5d02a84b-1dce-44e3-9df2-dd72e0d5b02f",
      "990edfd7-7393-47c5-b195-61583c8ec0ce"
    ];

    let currentUuid = 0;

    const mockPost = jest.fn(() => {
      const id = objectUploadUUIDs[currentUuid++];
      return {
        data: {
          data: {
            id,
            type: "object-upload",
            attributes: {
              dateTimeDigitized: "2003-12-14T12:01:44",
              fileType: "text",
              size: "500",
              originalFilename: `file${currentUuid}.pdf`
            }
          }
        }
      };
    });

    const mockSave = jest.fn((ops) =>
      ops.map((op, index) => ({
        ...op.resource,
        id: String(index)
      }))
    );
    const mockGet = jest.fn((path) => {
      if (path === "user-api/group") {
        return { data: [{ name: "example-group" }] };
      }
      if (path === "objectstore-api/config/file-upload") {
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
    const mockApiCtx = {
      apiClient: {
        get: mockGet,
        axios: {
          get: mockGet,
          post: mockPost
        }
      },
      save: mockSave
    };

    const wrapper = mountWithAppContext(<UploadPage />, {
      accountContext: MOCK_ACCOUNT_CONTEXT,
      apiContext: mockApiCtx as any
    });
    await waitForLoadingToDisappear();

    // Pretend the FileUploader is uploading these files:
    const mockAcceptedFiles = [
      new File(["file content"], "file1.pdf", { type: "application/pdf" }),
      new File(["file content"], "file2.pdf", { type: "application/pdf" }),
      new File(["file content"], "file3.pdf", { type: "application/pdf" })
    ];
    await waitFor(() => {
      expect(
        wrapper.getByText(/drag and drop files here/i)
      ).toBeInTheDocument();
    });

    // Find the file input in the Dropzone component
    const fileInput =
      wrapper.container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    // Simulate the file selection
    await userEvent.upload(fileInput!, mockAcceptedFiles);
    await waitForLoadingToDisappear();

    // Await the processing of the file uploads
    await waitFor(() => {
      expect(
        wrapper.getByRole("button", { name: "Continue with Workbook" })
      ).toBeInTheDocument();
    });

    // Submit
    await userEvent.click(
      wrapper.getByRole("button", { name: "Continue with Workbook" })
    );

    // The group name should be in the URL:
    await waitFor(() => {
      expect(mockPost).lastCalledWith(
        "/objectstore-api/file/example-group",
        // Form data with the file would go here:
        expect.anything(),
        // Passes in the custom error handler:
        expect.anything()
      );
    });

    // You should get redirected to the workbook upload page with the new metadata IDs.
    expect(mockPush).lastCalledWith({
      pathname: "/workbook/upload",
      query: {
        group: "example-group"
      }
    });

    expect(localStorage.getItem(BULK_ADD_FILES_KEY)).toEqual(
      JSON.stringify({
        group: "example-group",
        files: [
          { id: objectUploadUUIDs[0], originalFilename: "file1.pdf" },
          { id: objectUploadUUIDs[1], originalFilename: "file2.pdf" },
          { id: objectUploadUUIDs[2], originalFilename: "file3.pdf" }
        ]
      })
    );
  });

  it("Throws file upload errors with a readable message.", (done) => {
    const exampleErrorResponse = `{"errors": [{ "detail": "Error from Spring" }]}`;
    try {
      fileUploadErrorHandler(
        exampleErrorResponse,
        {
          name: "fileName"
        } as File,
        mockFormatMessage
      );
    } catch (error) {
      expect(error.message).toEqual("Error from Spring");
      done();
    }
  });

  it("Throws file upload error when unsupported file type is provided.", (done) => {
    const exampleErrorResponse = "<h1>Unsupported Media Type</h1>";
    try {
      fileUploadErrorHandler(
        exampleErrorResponse,
        {
          name: "fileName_test.png"
        } as File,
        mockFormatMessage
      );
    } catch {
      expect(mockFormatMessage).toHaveBeenCalledWith(
        "unsupportedFileTypeError",
        { fileName: "fileName_test.png" }
      );
      done();
    }
  });

  it("Handle http status 403 error", (done) => {
    const exampleErrorResponse = "HTTP Status 403 forbidden";
    try {
      fileUploadErrorHandler(
        exampleErrorResponse,
        {
          name: "fileName_test.png"
        } as File,
        mockFormatMessage
      );
    } catch {
      expect(mockFormatMessage).toHaveBeenCalledWith("http403ForbiddenError");
      done();
    }
  });

  it("Only renders if the user belongs a group", async () => {
    const wrapper = mountWithAppContext(<UploadPage />, {
      accountContext: { ...MOCK_ACCOUNT_CONTEXT, groupNames: [] }
    });

    expect(
      wrapper.getByText(/user must belong to a group/i)
    ).toBeInTheDocument();
  });
});
