import { cleanup, fireEvent, render } from "@testing-library/react";
import { AccountContextI } from "common-ui";
import { noop } from "lodash";
import UploadPage, {
  fileUploadErrorHandler
} from "../../pages/object-store/upload";
import { MockAppContextProvider } from "../../test-util/mock-app-context";

const mockPush = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

const MOCK_ACCOUNT_CONTEXT: AccountContextI = {
  authenticated: true,
  groups: ["/group-with-slash", "group-without-slash"],
  initialized: true,
  login: noop,
  logout: noop,
  token: "test-token",
  username: "test-user"
};

describe("Upload page", () => {
  let files;
  beforeEach(() => {
    jest.clearAllMocks();
    files = [createFile("file1.pdf", 1111, "application/pdf")];
  });

  afterEach(cleanup);

  it("renders the root and input nodes with the necessary props", () => {
    const { container } = render(
      <MockAppContextProvider accountContext={MOCK_ACCOUNT_CONTEXT}>
        <UploadPage />
      </MockAppContextProvider>
    );
    const rootDiv = container.querySelector("div#dndRoot");
    expect(rootDiv).toHaveProperty("style.border-color");
    expect(rootDiv?.querySelector("div.root>input")).toHaveProperty("multiple");
  });

  it("When dropped the files, page shows file names", async () => {
    const event = createDtWithFiles(files);
    const ui = (
      <MockAppContextProvider accountContext={MOCK_ACCOUNT_CONTEXT}>
        <UploadPage />
      </MockAppContextProvider>
    );
    const { container } = render(ui);
    const dropzone = container.querySelector(".root");
    dispatchEvt(dropzone, "drop", event);
    await flushPromises(ui, container);
    expect(container.querySelector("a[href$='file1.pdf']")).toBeDefined();
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

    const mockCtx = {
      apiClient: {
        axios: {
          post: mockPost
        }
      },
      save: mockSave
    };

    const event = createDtWithFiles([
      createFile("file1.pdf", 1111, "application/pdf"),
      createFile("file2.pdf", 1111, "application/pdf"),
      createFile("file3.pdf", 1111, "application/pdf")
    ]);

    const ui = (
      <MockAppContextProvider
        accountContext={MOCK_ACCOUNT_CONTEXT}
        apiContext={mockCtx as any}
      >
        <UploadPage />
      </MockAppContextProvider>
    );
    const { container } = render(ui);
    const dropzone = container.querySelector(".root");
    dispatchEvt(dropzone, "drop", event);
    await flushPromises(ui, container);

    fireEvent(
      container.querySelector("button[type='submit']") as any,
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true
      })
    );
    await flushPromises(ui, container);

    // The prefixed slash should be removed:
    expect(mockPost).lastCalledWith(
      "/objectstore-api/file/group-with-slash",
      // Form data with the file would go here:
      expect.anything(),
      // Passes in the custom error handler:
      { transformResponse: fileUploadErrorHandler }
    );

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            bucket: "group-with-slash",
            fileIdentifier: "c0f78fce-1825-4c4e-89c7-92fe0ed9dc73",
            type: "metadata"
          },
          type: "metadata"
        },
        {
          resource: {
            bucket: "group-with-slash",
            fileIdentifier: "c0f78fce-1825-4c4e-89c7-92fe0ed9dc73",
            type: "metadata"
          },
          type: "metadata"
        },
        {
          resource: {
            bucket: "group-with-slash",
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
    const ui = (
      <MockAppContextProvider
        accountContext={{ ...MOCK_ACCOUNT_CONTEXT, groups: [] }}
      >
        <UploadPage />
      </MockAppContextProvider>
    );
    const { container } = render(ui);

    expect(container.querySelector(".no-group-alert")).toBeTruthy();
  });
});

function createFile(name, size, type) {
  const file = new File([], name, { type });
  Object.defineProperty(file, "size", {
    get() {
      return size;
    }
  });
  return file;
}

function createDtWithFiles(files: File[] = []) {
  return {
    dataTransfer: {
      files,
      items: files.map(file => ({
        getAsFile: () => file,
        kind: "file",
        type: file.type
      })),
      types: ["Files"]
    }
  };
}

function dispatchEvt(node, type, data) {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, data);

  event.preventDefault();
  node.dispatchEvent(event);
}

function flushPromises(ui, container) {
  return new Promise(resolve =>
    global.setImmediate(() => {
      render(ui, { container });
      resolve(container);
    })
  );
}
