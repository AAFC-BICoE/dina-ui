import { PersistedResource } from "kitsu";
import { last } from "lodash";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Metadata } from "../../../../types/objectstore-api";
import {
  AttachmentsModalParams,
  useAttachmentsModal
} from "../attachments-modal";

const hookRender = jest.fn();

function lastHookReturn() {
  return last(hookRender.mock.calls)[0] as ReturnType<
    typeof useAttachmentsModal
  >;
}

function TestComponent({ initialMetadatas }: AttachmentsModalParams) {
  const hookReturn = useAttachmentsModal({ initialMetadatas });
  hookRender(hookReturn);
  return null;
}

const mockBulkGet = jest.fn(async paths => {
  if (paths.length === 0) {
    return [];
  }
  return paths.map((path: string) => ({
    // Return a mock metadata with the supplied ID:
    id: path.replace(/^\/metadata\//, ""),
    type: "metadata"
  }));
});

const apiContext: any = {
  bulkGet: mockBulkGet
};

describe("Attachments modal", () => {
  beforeEach(jest.clearAllMocks);

  it("Adds the selected Metadatas to the array.", async () => {
    mountWithAppContext(<TestComponent />, { apiContext });

    // Initially empty:
    expect(lastHookReturn().selectedMetadatas).toEqual([]);

    // Add some test IDs:
    lastHookReturn().addAttachedMetadatas(["1", "5", "9"]);
    await new Promise(setImmediate);

    // The Metadatas should have been added:
    expect(lastHookReturn().selectedMetadatas).toEqual([
      { id: "1", type: "metadata" },
      { id: "5", type: "metadata" },
      { id: "9", type: "metadata" }
    ]);

    // Add more IDs including duplicates:
    lastHookReturn().addAttachedMetadatas(["22", "5", "9"]);
    await new Promise(setImmediate);

    // Only unique IDs are added:
    expect(lastHookReturn().selectedMetadatas).toEqual([
      { id: "1", type: "metadata" },
      { id: "5", type: "metadata" },
      { id: "9", type: "metadata" },
      { id: "22", type: "metadata" }
    ]);
  });

  it("Removes selected Metadatas from the array", async () => {
    mountWithAppContext(<TestComponent />, { apiContext });

    // Initially empty:
    expect(lastHookReturn().selectedMetadatas).toEqual([]);

    // Add some test IDs:
    lastHookReturn().addAttachedMetadatas(["1", "5", "9"]);
    await new Promise(setImmediate);

    // Remove a Metadata:
    lastHookReturn().removeMetadata("5");
    await new Promise(setImmediate);

    // The Metadata was removed:
    expect(lastHookReturn().selectedMetadatas).toEqual([
      { id: "1", type: "metadata" },
      { id: "9", type: "metadata" }
    ]);
  });

  it("Can be initialized with existing Metadatas.", async () => {
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

    mountWithAppContext(<TestComponent initialMetadatas={TEST_METADATAS} />, {
      apiContext
    });

    // Initially empty:
    expect(lastHookReturn().selectedMetadatas).toEqual(TEST_METADATAS);
  });
});
