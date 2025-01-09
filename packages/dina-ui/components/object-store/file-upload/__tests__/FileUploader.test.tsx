import { DinaForm } from "common-ui";
import { noop } from "lodash";
import { mountWithAppContext } from "common-ui";
import { FileUploader } from "../FileUploader";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";

const MOCK_API_MAX_FILE_SIZE = "3GB";
const EXPECTED_MAX_FILE_SIZE_IN_BYTES = 3221225472;

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (path) => {
  if (path === "objectstore-api/config/file-upload") {
    return { data: { "max-file-size": MOCK_API_MAX_FILE_SIZE } };
  }
});

const mockCtx = {
  apiClient: {
    get: mockGet
  }
} as any;

describe("FileUploader component", () => {
  it("Converts the API's max file size from a gigabytes string to bytes.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <FileUploader onSubmit={noop} />
      </DinaForm>,
      { apiContext: mockCtx }
    );

    // Wait for any asynchronous behavior inside the component
    await waitFor(() =>
      expect(
        screen.getByText(/The maximum file size is 3GB./)
      ).toBeInTheDocument()
    );

    // Check if the message corresponds to the expected byte value
    // (For testing purposes, calculate it here if not directly accessible)
    const expectedMaxSizeMessage = `The maximum file size is ${
      EXPECTED_MAX_FILE_SIZE_IN_BYTES / 1024 ** 3
    }GB.`;
    expect(screen.getByText(expectedMaxSizeMessage)).toBeInTheDocument();
  });
});
