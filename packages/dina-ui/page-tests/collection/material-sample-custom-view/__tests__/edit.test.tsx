import { ResourceSelect, SaveArgs } from "common-ui";
import { ReactWrapper } from "enzyme";
import { PersistedResource } from "kitsu";
import CreatableSelect from "react-select/creatable";
import ReactSwitch from "react-switch";
import { StorageLinker } from "../../../../components";
import { FormTemplateEditPageLoaded } from "../../../../pages/collection/form-template/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import {
  AcquisitionEvent,
  CollectingEvent,
  FormTemplate,
  StorageUnit
} from "../../../../types/collection-api";
import { noop } from "lodash";

const mockOnSaved = jest.fn();

const TEST_GROUP_1 = {
  type: "group",
  name: "test-group-1",
  labels: { en: "Test Group 1" }
};

const TEST_PREP_TYPE = {
  id: "100",
  type: "preparation-type",
  name: "test-prep-type"
};

function testCollectionEvent(): Partial<CollectingEvent> {
  return {
    startEventDateTime: "2021-04-13",
    id: "321",
    type: "collecting-event",
    group: "test group"
  };
}

function testAcquisitionEvent(): Partial<AcquisitionEvent> {
  return {
    id: "987",
    type: "acquisition-event",
    group: "test group",
    receptionRemarks: "test reception remarks"
  };
}

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "user-api/group":
      return { data: [TEST_GROUP_1] };
    case "collection-api/collecting-event":
      return { data: [testCollectionEvent()] };
    case "collection-api/collecting-event/321?include=collectors,attachment,collectionMethod":
      return { data: testCollectionEvent() };
    case "collection-api/acquisition-event":
      return { data: [testAcquisitionEvent()] };
    case "collection-api/acquisition-event/987":
      return { data: testAcquisitionEvent() };
    case "collection-api/preparation-type":
      return { data: [TEST_PREP_TYPE] };
    case "agent-api/person":
    case "collection-api/coordinate-system":
    case "collection-api/srs":
    case "collection-api/material-sample-type":
    case "collection-api/vocabulary/degreeOfEstablishment":
    case "collection-api/vocabulary/srs":
    case "collection-api/material-sample":
    case "collection-api/managed-attribute":
    case "collection-api/vocabulary/materialSampleState":
    case "collection-api/collection":
    case "collection-api/project":
    case "collection-api/vocabulary/materialSampleType":
    case "collection-api/vocabulary/typeStatus":
    case "collection-api/organism":
    case "collection-api/collection-method":
    case "collection-api/vocabulary/coordinateSystem":
    case "collection-api/vocabulary/materialSampleType":
    case "objectstore-api/metadata":
    case "user-api/user":
      return { data: [] };
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map((path) => {
    switch (path) {
      case "managed-attribute/MATERIAL_SAMPLE.attribute_1":
        return { id: "1", key: "attribute_1", name: "Attribute 1" };
      case "managed-attribute/MATERIAL_SAMPLE.attribute_2":
        return { id: "1", key: "attribute_2", name: "Attribute 2" };
      case "managed-attribute/COLLECTING_EVENT.attribute_1":
        return { id: "1", key: "attribute_1", name: "Attribute 1" };
      case "managed-attribute/COLLECTING_EVENT.attribute_2":
        return { id: "1", key: "attribute_2", name: "Attribute 2" };
      case "managed-attribute/DETERMINATION.attribute_1":
        return { id: "1", key: "attribute_1", name: "Attribute 1" };
      case "managed-attribute/DETERMINATION.attribute_2":
        return { id: "1", key: "attribute_2", name: "Attribute 2" };
    }
  })
);

const mockSave = jest.fn<any, any>(async (saves: SaveArgs[]) =>
  saves.map((save) => ({
    ...save.resource,
    id: save.resource.id ?? "123"
  }))
);

const apiContext = {
  bulkGet: mockBulkGet,
  apiClient: {
    get: mockGet
  },
  save: mockSave
};

/** Mount the form and provide test util functions. */
async function mountForm(
  existingActionDefinition?: PersistedResource<FormTemplate>
) {
  const wrapper = mountWithAppContext(
    <FormTemplateEditPageLoaded
      fetchedFormTemplate={existingActionDefinition}
      onSaved={noop}
    />,
    { apiContext }
  );

  await new Promise(setImmediate);
  wrapper.update();

  const colEventSwitch = () =>
    wrapper.find(".enable-collecting-event").find(ReactSwitch);
  const catalogSwitch = () =>
    wrapper.find(".enable-catalogue-info").find(ReactSwitch);
  const storageSwitch = () => wrapper.find(".enable-storage").find(ReactSwitch);
  const organismsSwitch = () =>
    wrapper.find(".enable-organisms").find(ReactSwitch);
  const scheduledActionsSwitch = () =>
    wrapper.find(".enable-scheduled-actions").find(ReactSwitch);
  const acquisitionEventSwitch = () =>
    wrapper.find(".enable-acquisition-event").find(ReactSwitch);
  const associationsSwitch = () =>
    wrapper.find(".enable-associations").find(ReactSwitch);

  async function toggleDataComponent(
    switchElement: ReactWrapper<any>,
    val: boolean
  ) {
    switchElement.prop<any>("onChange")(val);
    if (!val) {
      // Click "yes" when asked Are You Sure:
      await new Promise(setImmediate);
      wrapper.update();
      wrapper.find(".modal-content form").simulate("submit");
      await new Promise(setImmediate);
      await new Promise(setImmediate);
    }
    await new Promise(setImmediate);
    wrapper.update();
  }

  async function toggleColEvent(val: boolean) {
    await toggleDataComponent(colEventSwitch(), val);
  }

  async function togglePreparations(val: boolean) {
    await toggleDataComponent(catalogSwitch(), val);
  }

  async function toggleStorage(val: boolean) {
    await toggleDataComponent(storageSwitch(), val);
  }

  async function toggleOrganisms(val: boolean) {
    await toggleDataComponent(organismsSwitch(), val);
  }

  async function toggleScheduledActions(val: boolean) {
    await toggleDataComponent(scheduledActionsSwitch(), val);
  }

  async function toggleAcquisitionEvent(val: boolean) {
    await toggleDataComponent(acquisitionEventSwitch(), val);
  }
  async function toggleAssociations(val: boolean) {
    await toggleDataComponent(associationsSwitch(), val);
  }

  async function fillOutRequiredFields() {
    // Set the name:
    wrapper
      .find(".workflow-main-details .name-field input")
      .simulate("change", { target: { value: "test-config" } });

    await new Promise(setImmediate);
    wrapper.update();
  }

  async function submitForm() {
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();
  }

  return {
    wrapper,
    toggleColEvent,
    togglePreparations,
    toggleStorage,
    toggleOrganisms,
    toggleScheduledActions,
    toggleAcquisitionEvent,
    toggleAssociations,
    colEventSwitch,
    catalogSwitch,
    storageSwitch,
    scheduledActionsSwitch,
    organismsSwitch,
    acquisitionEventSwitch,
    associationsSwitch,
    fillOutRequiredFields,
    submitForm
  };
}

describe("Workflow template edit page", () => {
  beforeEach(jest.clearAllMocks);

  it("Renders the blank template edit page", async () => {
    const { wrapper } = await mountForm();

    // Get the switches:
    const switches = wrapper.find(".material-sample-nav").find(ReactSwitch);
    expect(switches.length).not.toEqual(0);

    // All switches should be unchecked:
    expect(switches.map((node) => node.prop("checked"))).toEqual(
      switches.map(() => false)
    );
  });

  it("Edits an existing action-definition: Renders the form with minimal data.", async () => {
    const { colEventSwitch, catalogSwitch, scheduledActionsSwitch } =
      await mountForm({
        type: "form-template",
        viewConfiguration: {
          formTemplate: {},
          navOrder: null,
          type: "material-sample-form-template"
        },
        group: "test-group-1",
        id: "123",
        restrictToCreatedBy: false,
        name: "test-config"
      });

    // Checkboxes are unchecked:
    expect(colEventSwitch().prop("checked")).toEqual(false);
    expect(catalogSwitch().prop("checked")).toEqual(false);
    expect(scheduledActionsSwitch().prop("checked")).toEqual(false);
  });
});
