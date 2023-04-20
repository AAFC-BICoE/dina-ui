import { ResourceSelect, ResourceWithHooks } from "common-ui";
import { InputResource } from "kitsu";
import { useState } from "react";
import Switch from "react-switch";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { MaterialSample } from "../../../types/collection-api";
import {
  getSampleBulkOverrider,
  initializeRefHookFormProps
} from "../../bulk-material-sample/MaterialSampleBulkEditor";
import { useMaterialSampleFormTemplateSelectState } from "../../collection/form-template/useMaterialSampleFormTemplateSelectState";
import { MaterialSampleFormProps } from "../../collection/material-sample/MaterialSampleForm";
import { BulkNavigatorTab } from "../BulkEditNavigator";
import { useBulkEditTab } from "../useBulkEditTab";

const mockSubmitOverride = jest.fn();

interface BulkEditTabProps {
  baseSample?: InputResource<MaterialSample>;
}

/** Test component to test the Bulk Edit Tab in isolation. */
function BulkEditTab({ baseSample }: BulkEditTabProps) {
  // Allow selecting a custom view for the form:
  const {
    sampleFormTemplate,
    setSampleFormTemplateUUID,
    visibleManagedAttributeKeys,
    materialSampleInitialValues,
    collectingEventInitialValues
  } = useMaterialSampleFormTemplateSelectState({});

  const [selectedTab, setSelectedTab] = useState<
    BulkNavigatorTab | ResourceWithHooks
  >();

  const {
    bulkEditFormRef,
    bulkEditSampleHook,
    sampleHooks,
    materialSampleForm,
    formTemplateProps
  }: {
    bulkEditFormRef;
    bulkEditSampleHook;
    sampleHooks: any;
    materialSampleForm: JSX.Element;
    formTemplateProps: Partial<MaterialSampleFormProps>;
  } = initializeRefHookFormProps(
    [baseSample],
    visibleManagedAttributeKeys,
    selectedTab,
    sampleFormTemplate,
    materialSampleInitialValues,
    collectingEventInitialValues
  );
  function sampleBulkOverrider() {
    /** Sample input including blank/empty fields. */
    return getSampleBulkOverrider(bulkEditFormRef, bulkEditSampleHook);
  }

  const { bulkEditTab } = useBulkEditTab({
    resourceHooks: [],
    resourceForm: materialSampleForm,
    bulkEditFormRef
  });

  return (
    <div>
      {bulkEditTab.content(true)}
      <button
        className="get-overrides"
        type="button"
        onClick={async () => {
          mockSubmitOverride(
            await sampleBulkOverrider()(
              baseSample || { type: "material-sample" }
            )
          );
        }}
      />
    </div>
  );
}

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "agent-api/person":
    case "collection-api/collection":
    case "collection-api/collection-method":
    case "collection-api/collecting-event":
    case "collection-api/material-sample":
    case "collection-api/managed-attribute":
    case "collection-api/material-sample-type":
    case "collection-api/project":
    case "collection-api/vocabulary/materialSampleState":
    case "collection-api/preparation-type":
    case "objectstore-api/metadata":
    case "user-api/group":
    case "user-api/user":
    case "collection-api/storage-unit":
    case "collection-api/storage-unit-type":
    case "collection-api/vocabulary/degreeOfEstablishment":
    case "collection-api/vocabulary/srs":
    case "collection-api/vocabulary/coordinateSystem":
    case "collection-api/form-template":
      return { data: [] };
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) => {
  return paths.map((path) => {
    switch (path) {
      case "managed-attribute/MATERIAL_SAMPLE.a":
        return {
          id: "1",
          type: "managed-attribute",
          vocabularyElementType: "STRING",
          managedAttributeComponent: "MATERIAL_SAMPLE",
          key: "a",
          name: "Managed Attribute 1"
        };
      case "managed-attribute/MATERIAL_SAMPLE.b":
        return {
          id: "2",
          type: "managed-attribute",
          vocabularyElementType: "STRING",
          managedAttributeComponent: "MATERIAL_SAMPLE",
          key: "b",
          name: "Managed Attribute 2"
        };
      case "managed-attribute/MATERIAL_SAMPLE.c":
        return {
          id: "3",
          type: "managed-attribute",
          vocabularyElementType: "STRING",
          managedAttributeComponent: "MATERIAL_SAMPLE",
          key: "c",
          name: "Managed Attribute 3"
        };
    }
  });
});

const mockSave = jest.fn<any, any>((ops) =>
  ops.map((op) => ({
    ...op.resource,
    id: op.resource.id ?? "11111111-1111-1111-1111-111111111111"
  }))
);

const testCtx = {
  apiContext: {
    apiClient: { get: mockGet },
    save: mockSave,
    bulkGet: mockBulkGet
  }
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

    expect(mockSubmitOverride).lastCalledWith({
      isRestricted: false,
      type: "material-sample"
    });
  });

  it("Overrides the barcode field", async () => {
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
      barcode: "test-barcode-override",
      isRestricted: false
    });
  });

  it("Overrides only the linked resources after enabling all data components", async () => {
    const wrapper = mountWithAppContext(
      <BulkEditTab
        baseSample={{
          type: "material-sample",
          materialSampleName: "test-sample"
        }}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".material-sample-nav")
      .find(Switch)
      .forEach((node) => node.prop<any>("onChange")(true));

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.get-overrides").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSubmitOverride).lastCalledWith({
      // Keeps the name and type:
      type: "material-sample",
      materialSampleName: "test-sample",
      // Adds the Col event:
      collectingEvent: {
        id: "11111111-1111-1111-1111-111111111111",
        type: "collecting-event"
      },
      // Sets the default association because it's enabled and there are no values set in the other tabs:
      associations: [{}],
      // Sets the default organism because it's enabled and there are no values set in the other tabs:
      organism: [{}],
      organismsQuantity: 1
    });
  });

  it("Combines managed attribute values from the original and the bulk override.", async () => {
    const wrapper = mountWithAppContext(
      <BulkEditTab
        baseSample={{
          type: "material-sample",
          materialSampleName: "test-sample",
          managedAttributes: {
            a: "value A",
            b: "value B"
          }
        }}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Override values for attributes B and C:
    wrapper
      .find(".managed-attributes-editor")
      .find(ResourceSelect)
      .prop<any>("onChange")([
      { key: "b", vocabularyElementType: "STRING" },
      { key: "c", vocabularyElementType: "STRING" }
    ]);

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".b-field input")
      .simulate("change", { target: { value: "new-b-value" } });
    wrapper
      .find(".c-field input")
      .simulate("change", { target: { value: "new-c-value" } });

    wrapper.find("button.get-overrides").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSubmitOverride).lastCalledWith({
      // Keeps the name and type:
      isRestricted: false,
      type: "material-sample",
      materialSampleName: "test-sample",
      managedAttributes: {
        a: "value A",
        b: "new-b-value",
        c: "new-c-value"
      }
    });
  });
});
