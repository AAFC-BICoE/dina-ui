import { DinaForm } from "common-ui";
import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Metadata } from "../../../../types/objectstore-api";
import { AttachmentSection } from "../AttachmentSection";
import { AttachmentsField } from "../AttachmentsField";

const mockBulkGet = jest.fn<any, any>(async (paths) => {
  if (paths.length === 0) {
    return [];
  }
  return paths.map((path: string) => ({
    // Return a mock metadata with the supplied ID:
    id: path.replace(/^metadata\//, ""),
    type: "metadata"
  }));
});

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "objectstore-api/metadata":
      return { data: TEST_METADATAS };
  }
});

const apiContext = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet
};

const testCtx = { apiContext };

const mockOnSubmit = jest.fn<any, any>();

describe("AttachmentsField component", () => {
  beforeEach(jest.clearAllMocks);

  it("Adds the selected Metadatas to the array.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <AttachmentsField
          name="attachment"
          allowNewFieldName="attachmentsConfig.allowNew"
          allowExistingFieldName="attachmentsConfig.allowExisting"
          attachmentPath={`collection-api/collecting-event/100/attachment`}
        />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Initially empty:
    expect(wrapper.find(".rt-tbody .rt-tr").length).toEqual(0);

    // Add some attachments:
    wrapper.find("button.add-attachments").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Simulate adding 2 metadatas:
    wrapper.find(AttachmentSection).prop("afterMetadatasSaved")([
      "added-1",
      "added-2"
    ]);

    await new Promise(setImmediate);
    wrapper.update();

    // The Metadatas should have been added:
    expect(wrapper.find("tbody tr").length).toEqual(2);

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockOnSubmit).lastCalledWith({
      attachment: [
        { id: "added-1", type: "metadata" },
        { id: "added-2", type: "metadata" }
      ]
    });
  });

  it("Prevents duplicate attachments from being attached.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <AttachmentsField
          name="attachment"
          allowNewFieldName="attachmentsConfig.allowNew"
          allowExistingFieldName="attachmentsConfig.allowExisting"
          attachmentPath={`collection-api/collecting-event/100/attachment`}
        />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Initially empty:
    expect(wrapper.find(".rt-tbody .rt-tr").length).toEqual(0);

    // Add some attachments:
    wrapper.find("button.add-attachments").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Simulate adding duplicates of 2 metadatas:
    wrapper.find(AttachmentSection).prop("afterMetadatasSaved")([
      "added-1",
      "added-1",
      "added-1",
      "added-2",
      "added-2",
      "added-2"
    ]);

    await new Promise(setImmediate);
    wrapper.update();

    // The 2 unique Metadatas should have been added:
    expect(wrapper.find("tbody tr").length).toEqual(2);

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockOnSubmit).lastCalledWith({
      attachment: [
        { id: "added-1", type: "metadata" },
        { id: "added-2", type: "metadata" }
      ]
    });
  });

  it("Removes selected Metadatas from the array.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          attachment: [
            { id: "example-1", type: "metadata" },
            { id: "example-2", type: "metadata" }
          ]
        }}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <AttachmentsField
          name="attachment"
          allowNewFieldName="attachmentsConfig.allowNew"
          allowExistingFieldName="attachmentsConfig.allowExisting"
          attachmentPath={`collection-api/collecting-event/100/attachment`}
        />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Renders 2 rows initially:
    expect(wrapper.find("tbody tr").length).toEqual(2);

    wrapper.find("button.remove-attachment").first().simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockOnSubmit).lastCalledWith({
      attachment: [{ id: "example-2", type: "metadata" }]
    });
  });
});

const TEST_METADATAS: PersistedResource<Metadata>[] = [
  {
    id: "1",
    type: "metadata",
    originalFilename: "test-file-1",
    bucket: "bucket",
    fileIdentifier: "111"
  },
  {
    id: "2",
    type: "metadata",
    originalFilename: "test-file-2",
    bucket: "bucket",
    fileIdentifier: "222"
  }
];
