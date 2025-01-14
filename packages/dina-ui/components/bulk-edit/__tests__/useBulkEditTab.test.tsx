import { ResourceWithHooks } from "common-ui";
import { InputResource } from "kitsu";
import { useState } from "react";
import { mountWithAppContext } from "common-ui";
import { MaterialSample } from "../../../types/collection-api";
import {
  getSampleBulkOverrider,
  initializeRefHookFormProps
} from "../../bulk-material-sample/MaterialSampleBulkEditor";
import { useMaterialSampleFormTemplateSelectState } from "../../collection/form-template/useMaterialSampleFormTemplateSelectState";
import { MaterialSampleFormProps } from "../../collection/material-sample/MaterialSampleForm";
import { BulkNavigatorTab } from "../BulkEditNavigator";
import { useBulkEditTab } from "../useBulkEditTab";
import { fireEvent, waitForElementToBeRemoved } from "@testing-library/react";

const mockSubmitOverride = jest.fn();

interface BulkEditTabProps {
  baseSample?: InputResource<MaterialSample>;
}

/** Test component to test the Bulk Edit Tab in isolation. */
function BulkEditTab({ baseSample }: BulkEditTabProps) {
  // Allow selecting a custom view for the form:
  const {
    sampleFormTemplate,
    visibleManagedAttributeKeys,
    materialSampleInitialValues,
    collectingEventInitialValues
  } = useMaterialSampleFormTemplateSelectState({});

  const [selectedTab] = useState<BulkNavigatorTab | ResourceWithHooks>();

  const {
    bulkEditFormRef,
    bulkEditSampleHook,
    materialSampleForm
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
      >
        Get Overrides
      </button>
    </div>
  );
}

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/managed-attribute":
      return {
        data: [
          {
            id: "1",
            type: "managed-attribute",
            vocabularyElementType: "STRING",
            managedAttributeComponent: "MATERIAL_SAMPLE",
            key: "a",
            name: "Managed Attribute 1"
          },
          {
            id: "2",
            type: "managed-attribute",
            vocabularyElementType: "STRING",
            managedAttributeComponent: "MATERIAL_SAMPLE",
            key: "b",
            name: "Managed Attribute 2"
          },
          {
            id: "3",
            type: "managed-attribute",
            vocabularyElementType: "STRING",
            managedAttributeComponent: "MATERIAL_SAMPLE",
            key: "c",
            name: "Managed Attribute 3"
          }
        ]
      };
    case "agent-api/person":
    case "collection-api/collection":
    case "collection-api/collection-method":
    case "collection-api/collecting-event":
    case "collection-api/material-sample":
    case "collection-api/material-sample-type":
    case "collection-api/project":
    case "collection-api/vocabulary2/materialSampleState":
    case "collection-api/preparation-type":
    case "objectstore-api/metadata":
    case "user-api/group":
    case "user-api/user":
    case "collection-api/storage-unit":
    case "collection-api/storage-unit-type":
    case "collection-api/vocabulary2/degreeOfEstablishment":
    case "collection-api/vocabulary2/srs":
    case "collection-api/vocabulary2/coordinateSystem":
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

    fireEvent.click(wrapper.getByRole("button", { name: /get overrides/i }));
    await new Promise(setImmediate);

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

    // Update the barcode
    fireEvent.change(wrapper.getByRole("textbox", { name: /barcode/i }), {
      target: { value: "test-barcode-override" }
    });

    fireEvent.click(wrapper.getByRole("button", { name: /get overrides/i }));
    await new Promise(setImmediate);

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

    // Enable all data components...
    const switches = wrapper.container.querySelectorAll(
      ".material-sample-nav .react-switch-bg"
    );
    if (!switches || switches.length === 0) {
      fail("Data component switches are expected...");
    }
    switches.forEach((switchFound) => {
      fireEvent.click(switchFound);
    });
    await new Promise(setImmediate);

    fireEvent.click(wrapper.getByRole("button", { name: /get overrides/i }));
    await new Promise(setImmediate);

    expect(mockSubmitOverride).lastCalledWith({
      // Keeps the name and type:
      type: "material-sample",
      materialSampleName: "test-sample",
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

    const managedAttributesVisible = wrapper.getByRole("combobox", {
      name: /add new/i
    });

    // Select the "B" managed attribute to display.
    fireEvent.focus(managedAttributesVisible);
    fireEvent.change(managedAttributesVisible, {
      target: { value: "Managed Attribute 2" }
    });
    fireEvent.keyDown(managedAttributesVisible, { key: "ArrowDown" });
    await new Promise(setImmediate);
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));
    fireEvent.click(
      wrapper.getByRole("option", { name: /managed attribute 2/i })
    );
    await new Promise(setImmediate);

    // Select the "C" managed attribute to display.
    fireEvent.focus(managedAttributesVisible);
    fireEvent.change(managedAttributesVisible, {
      target: { value: "Managed Attribute 3" }
    });
    fireEvent.keyDown(managedAttributesVisible, { key: "ArrowDown" });
    await new Promise(setImmediate);
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));
    fireEvent.click(
      wrapper.getByRole("option", { name: /managed attribute 3/i })
    );
    await new Promise(setImmediate);

    const textboxB = wrapper.container.querySelector(
      ".managedAttributes_b-field input"
    );
    const textboxC = wrapper.container.querySelector(
      ".managedAttributes_c-field input"
    );
    if (!textboxB || !textboxC) {
      fail("The managed attribute textboxes need to exist at this point.");
    }
    fireEvent.change(textboxB, { target: { value: "new-b-value" } });
    fireEvent.change(textboxC, { target: { value: "new-c-value" } });

    fireEvent.click(wrapper.getByRole("button", { name: /get overrides/i }));
    await new Promise(setImmediate);

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
