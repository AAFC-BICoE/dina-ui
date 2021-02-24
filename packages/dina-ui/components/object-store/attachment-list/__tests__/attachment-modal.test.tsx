import { last } from "lodash";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { useAttachmentsModal } from "../attachments-modal";

const hookRender = jest.fn();

function lastHookReturn() {
  return last(hookRender.mock.calls)[0] as ReturnType<
    typeof useAttachmentsModal
  >;
}

function TestComponent() {
  const hookReturn = useAttachmentsModal();
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
});
