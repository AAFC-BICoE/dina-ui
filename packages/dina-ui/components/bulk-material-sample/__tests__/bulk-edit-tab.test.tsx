import { InputResource } from "kitsu";
import { MaterialSample } from "../../../types/collection-api";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { useBulkEditTab } from "../bulk-edit-tab";

const mockSubmitOverride = jest.fn();

interface BulkEditTabProps {
  baseSample?: InputResource<MaterialSample>;
}

/** Test component to test the Bulk Edit Tab in isolation. */
function BulkEditTab({ baseSample }: BulkEditTabProps) {
  const { bulkEditTab, withBulkEditOverrides } = useBulkEditTab();

  return (
    <div>
      {bulkEditTab.content}
      <button
        className="get-overrides"
        type="button"
        onClick={async () => {
          mockSubmitOverride(
            await withBulkEditOverrides(
              baseSample || { type: "material-sample" }
            )
          );
        }}
      />
    </div>
  );
}

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/collection":
    case "collection-api/material-sample":
    case "objectstore-api/metadata":
    case "collection-api/managed-attribute":
    case "collection-api/material-sample-type":
    case "collection-api/project":
    case "collection-api/vocabulary/materialSampleState":
    case "user-api/group":
      return { data: [] };
  }
});

const testCtx = {
  apiContext: { apiClient: { get: mockGet } }
};

describe("Material sample bulk edit tab", () => {
  beforeEach(jest.clearAllMocks);

  it("Without changing any fields, overrides nothing", async () => {
    const wrapper = mountWithAppContext(<BulkEditTab />, testCtx);

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.get-overrides").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSubmitOverride).lastCalledWith({ type: "material-sample" });
  });

  it("Overriedes the barcode field", async () => {
    const wrapper = mountWithAppContext(
      <BulkEditTab
        baseSample={{
          type: "material-sample",
          materialSampleName: "test-sample",
          barcode: "test-barcode-original"
        }}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Update the barcode
    wrapper
      .find(".barcode-field input")
      .simulate("change", { target: { value: "test-barcode-override" } });

    wrapper.find("button.get-overrides").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSubmitOverride).lastCalledWith({
      type: "material-sample",
      materialSampleName: "test-sample",
      barcode: "test-barcode-override"
    });
  });
});
