import { AccountContextI, OnFormikSubmit } from "common-ui";
import { noop } from "lodash";
import {
  FileUploader,
  IFileWithMeta,
  IMeta
} from "../../../components/object-store";
import { fileUploadErrorHandler } from "../../../components/object-store/file-upload/FileUploadProvider";
import UploadPage, {
  BULK_ADD_IDS_KEY
} from "../../../pages/object-store/upload";
import { mountWithAppContext2 } from "../../../test-util/mock-app-context";
import { fireEvent, screen } from "@testing-library/react";
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
  login: noop,
  logout: noop,
  roles: [],
  // Mock for a successful token update.
  getCurrentToken: () => Promise.resolve("test-token"),
  username: "test-user"
};

describe("Upload page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Uploads files when you click the Upload button", async () => {
    const mockPost = jest.fn(() => {
      return {
        data: {
          dateTimeDigitized: "2003-12-14T12:01:44",
          fileIdentifier: "c0f78fce-1825-4c4e-89c7-92fe0ed9dc73",
          fileType: "text",
          size: "500"
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

    const wrapper = mountWithAppContext2(<UploadPage />, {
      accountContext: MOCK_ACCOUNT_CONTEXT,
      apiContext: mockApiCtx as any
    });

    // Pretend the FileUploader is uploading these files:
    const mockAcceptedFiles = [
      new File(["file content"], "file1.pdf", { type: "application/pdf" }),
      new File(["file content"], "file2.pdf", { type: "application/pdf" }),
      new File(["file content"], "file3.pdf", { type: "application/pdf" })
    ];
    await new Promise(setImmediate);

    // Find the file input in the Dropzone component
    const fileInput = screen.getByLabelText(/drag and drop files here/i);

    // Mock the `FileList` containing the files:
    Object.defineProperty(fileInput, "files", {
      value: mockAcceptedFiles
    });

    // Simulate the file selection
    fireEvent.change(fileInput);

    // Await the processing of the file uploads
    await new Promise(setImmediate);

    // Submit
    userEvent.click(wrapper.getByRole("button", { name: /save/i }));

    await new Promise(setImmediate);

    // The group name should be in the URL:
    expect(mockPost).lastCalledWith(
      "/objectstore-api/file/example-group",
      // Form data with the file would go here:
      expect.anything(),
      // Passes in the custom error handler:
      expect.anything()
    );

    // You should get redirected to the bulk edit page with the new metadata IDs.
    expect(mockPush).lastCalledWith({
      pathname: "/object-store/metadata/bulk-edit",
      query: {
        group: "example-group"
      }
    });

    expect(localStorage.getItem(BULK_ADD_IDS_KEY)).toEqual(
      '["c0f78fce-1825-4c4e-89c7-92fe0ed9dc73","c0f78fce-1825-4c4e-89c7-92fe0ed9dc73","c0f78fce-1825-4c4e-89c7-92fe0ed9dc73"]'
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
    } catch (error) {
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
    } catch (error) {
      expect(mockFormatMessage).toHaveBeenCalledWith("http403ForbiddenError");
      done();
    }
  });

  it("Only renders if the user belongs a group", () => {
    const wrapper = mountWithAppContext2(<UploadPage />, {
      accountContext: { ...MOCK_ACCOUNT_CONTEXT, groupNames: [] }
    });

    expect(
      wrapper.getByText(/user must belong to a group/i)
    ).toBeInTheDocument();
  });
});
