import { UploadingMetadataBulkEditor } from "../../../bulk-metadata/UploadingMetadataBulkEditor";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import {
  FileUploader,
  IFileWithMeta,
  IMeta
} from "../../file-upload/FileUploader";
import { AttachmentUploader } from "../AttachmentUploader";

const mockPost = jest.fn(() => {
  return {
    data: {
      dateTimeDigitized: "2003-12-14T12:01:44",
      fileIdentifier: "c0f78fce-1825-4c4e-89c7-92fe0ed9dc73",
      fileType: "image",
      size: "500"
    }
  };
});
const mockGet = jest.fn((path) => {
  if (path === "objectstore-api/config/default-values") {
    return {
      data: { values: [] }
    };
  }
});
const mockSave = jest.fn((ops) =>
  ops.map((op) => ({
    ...op.resource,
    id: "11111111-1111-1111-1111-111111111111"
  }))
);

const apiContext = {
  apiClient: {
    get: mockGet,
    axios: {
      get: mockGet,
      post: mockPost
    }
  },
  save: mockSave
} as any;

const mockAfterMetadatasSaved = jest.fn();

describe("AttachmentUploader component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Uploads the files and opens the Metadata editor.", async () => {
    // Pretend the FileUploader is uploading these files:
    const mockAcceptedFiles: Partial<IFileWithMeta>[] = [
      {
        file: { name: "file1.pdf", type: "application/pdf" } as File,
        meta: { lastModifiedDate: "2019-08-28T20:37:21.502Z" } as IMeta
      },
      {
        file: { name: "file2.pdf", type: "application/pdf" } as File,
        meta: { lastModifiedDate: "2019-08-29T20:37:21.502Z" } as IMeta
      },
      {
        file: { name: "file3.pdf", type: "application/pdf" } as File,
        meta: { lastModifiedDate: "2019-08-30T20:37:21.502Z" } as IMeta
      }
    ];

    const wrapper = mountWithAppContext(
      <AttachmentUploader afterMetadatasSaved={mockAfterMetadatasSaved} />,
      { apiContext }
    );

    // Call the onSubmit funciton with uploaded files:
    wrapper.find(FileUploader).prop<any>("onSubmit")(
      {
        acceptedFiles: mockAcceptedFiles,
        group: "example-group"
      },
      null as any
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Renders the bulk editor with our prop passed in.
    await wrapper.find(UploadingMetadataBulkEditor).prop<any>("onSaved")([
      "00000000-0000-0000-0000-000000000000",
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222"
    ]);

    // The Bulk editor calls our callback that was passed into the AttachmentUploader:
    expect(mockAfterMetadatasSaved).lastCalledWith([
      "00000000-0000-0000-0000-000000000000",
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222"
    ]);
  });
});
