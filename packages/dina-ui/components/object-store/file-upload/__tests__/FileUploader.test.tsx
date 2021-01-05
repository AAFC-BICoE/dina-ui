import { Form, Formik } from "formik";
import { noop } from "lodash";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { FileUploader } from "../FileUploader";

const MOCK_API_MAX_FILE_SIZE = "3GB";
const EXPECTED_MAX_FILE_SIZE_IN_BYTES = 3221225472;

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async path => {
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
      <Formik initialValues={{}} onSubmit={noop}>
        <Form>
          <FileUploader acceptedFileTypes="image/*" onSubmit={noop} />
        </Form>
      </Formik>,
      { apiContext: mockCtx }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper.findWhere(node => node.prop("maxSizeBytes")).prop("maxSizeBytes")
    ).toEqual(EXPECTED_MAX_FILE_SIZE_IN_BYTES);
  });
});
