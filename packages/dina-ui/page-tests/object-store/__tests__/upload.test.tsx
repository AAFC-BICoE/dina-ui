import { AccountContextI, OnFormikSubmit } from "common-ui";
import { noop } from "lodash";
import { FileUploader, IFileWithMeta, IMeta } from "../../../components";
import UploadPage, {
  fileUploadErrorHandler
} from "../../../pages/object-store/upload";
import { mountWithAppContext } from "../../../test-util/mock-app-context";

const mockPush = jest.fn();

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
  token: "test-token",
  username: "test-user"
};

describe("Upload page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders FileUploader with the necessary props", () => {
    const wrapper = mountWithAppContext(<UploadPage />, {
      accountContext: MOCK_ACCOUNT_CONTEXT
    });

    expect(wrapper.find(FileUploader).prop("acceptedFileTypes")).toEqual(
      "image/*,audio/*,video/*,.pdf,.doc,.docx,.png"
    );
  });

  it("Uploads files when you click the Upload button", async () => {
    const mockPost = jest.fn(() => {
      return {
        data: {
          fileIdentifier: "c0f78fce-1825-4c4e-89c7-92fe0ed9dc73",
          fileType: "image",
          size: "500"
        }
      };
    });

    const mockSave = jest.fn(ops =>
      ops.map(op => ({
        ...op.resource,
        id: "11111111-1111-1111-1111-111111111111"
      }))
    );
    const mockApiCtx = {
      apiClient: {
        axios: {
          post: mockPost
        }
      },
      save: mockSave
    };

    const wrapper = mountWithAppContext(<UploadPage />, {
      accountContext: MOCK_ACCOUNT_CONTEXT,
      apiContext: mockApiCtx as any
    });

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

    // Call the onSubmit funciton with uploaded files:
    wrapper.find(FileUploader).prop<OnFormikSubmit>("onSubmit")(
      {
        acceptedFiles: mockAcceptedFiles,
        group: "example-group"
      },
      null as any
    );

    await new Promise(setImmediate);

    // The group name should be in the URL:
    expect(mockPost).lastCalledWith(
      "/objectstore-api/file/example-group",
      // Form data with the file would go here:
      expect.anything(),
      // Passes in the custom error handler:
      { transformResponse: fileUploadErrorHandler }
    );

    wrapper.update();
    // call the save button to save the metadata for the uploaded files
    wrapper.find("form.saveMultiMeta").simulate("submit");
    await new Promise(setImmediate);
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            acDigitizationDate: "2019-08-28T20:37:21+00:00",
            acMetadataCreator: {
              id: "6ee06232-e801-4cd5-8fc5-127aa14c3ace",
              type: "person"
            },
            bucket: "example-group",
            fileIdentifier: "c0f78fce-1825-4c4e-89c7-92fe0ed9dc73",
            type: "metadata"
          },
          type: "metadata"
        },
        {
          resource: {
            acDigitizationDate: "2019-08-29T20:37:21+00:00",
            acMetadataCreator: {
              id: "6ee06232-e801-4cd5-8fc5-127aa14c3ace",
              type: "person"
            },
            bucket: "example-group",
            fileIdentifier: "c0f78fce-1825-4c4e-89c7-92fe0ed9dc73",
            type: "metadata"
          },
          type: "metadata"
        },
        {
          resource: {
            acDigitizationDate: "2019-08-30T20:37:21+00:00",
            acMetadataCreator: {
              id: "6ee06232-e801-4cd5-8fc5-127aa14c3ace",
              type: "person"
            },
            bucket: "example-group",
            fileIdentifier: "c0f78fce-1825-4c4e-89c7-92fe0ed9dc73",
            type: "metadata"
          },
          type: "metadata"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );

    // You should get redirected to the bulk edit page with the new metadata IDs.
    expect(mockPush).lastCalledWith({
      pathname: "/object-store/metadata/edit",
      query: {
        ids: [
          "11111111-1111-1111-1111-111111111111",
          "11111111-1111-1111-1111-111111111111",
          "11111111-1111-1111-1111-111111111111"
        ].join()
      }
    });
  });

  it("Throws file upload errors with a readable message.", done => {
    const exampleErrorResponse = `{"errors": [{ "detail": "Error from Spring" }]}`;
    try {
      fileUploadErrorHandler(exampleErrorResponse);
    } catch (error) {
      expect(error.message).toEqual("Error from Spring");
      done();
    }
  });

  it("Only renders if the user belongs a group", () => {
    const wrapper = mountWithAppContext(<UploadPage />, {
      accountContext: { ...MOCK_ACCOUNT_CONTEXT, groupNames: [] }
    });

    expect(wrapper.find(".no-group-alert")).toBeTruthy();
  });
});
