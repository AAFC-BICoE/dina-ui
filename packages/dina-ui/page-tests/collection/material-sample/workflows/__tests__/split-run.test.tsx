import SplitRunAction from "../../../../../pages/collection/material-sample/workflows/split-run";
import { SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY } from "../../../../../pages/collection/material-sample/workflows/split-config";
import { mountWithAppContext } from "../../../../../test-util/mock-app-context";
import { PersistedResource } from "kitsu";
import {
  MaterialSample,
  CollectingEvent,
  MaterialSampleRunConfig
} from "../../../../../../dina-ui/types/collection-api";
import { PreparationType } from "../../../../../../dina-ui/types/collection-api/resources/PreparationType";

jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn() })
}));

function testMaterialSample(): PersistedResource<MaterialSample>[] {
  return [
    {
      id: "1",
      type: "material-sample",
      group: "test group",
      dwcCatalogNumber: "my-number",
      collectingEvent: {
        id: "1",
        type: "collecting-event"
      } as PersistedResource<CollectingEvent>
    }
  ];
}

function testPreparationType(): PersistedResource<PreparationType>[] {
  return [
    {
      id: "1",
      name: "test preparation type",
      type: "preparation-type"
    }
  ];
}

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/material-sample":
      return {
        data: testMaterialSample()
      };
    case "collection-api/preparation-type":
      return { data: testPreparationType() };
    case "agent-api/person":
      return { data: [] };
  }
});

const mockSave = jest.fn(ops =>
  ops.map(op => ({
    ...op.resource,
    id: "11111111-1111-1111-1111-111111111111"
  }))
);

const apiContext = {
  apiClient: {
    get: mockGet
  },
  save: mockSave
};

const testSeriesModeRunConfig: MaterialSampleRunConfig = {
  metadata: { actionRemarks: "Remarks on this run config" },
  configure: {
    generationMode: "SERIES",
    numOfChildToCreate: 1,
    baseName: "CustomParentName",
    start: "10",
    suffixType: "Numerical",
    destroyOriginal: true
  },
  configure_children: { sampleNames: ["my custom name"], sampleDescs: [] }
};

const testBatchModeRunConfig: MaterialSampleRunConfig = {
  metadata: { actionRemarks: "Remarks on this run config" },
  configure: {
    generationMode: "BATCH",
    numOfChildToCreate: 2,
    baseName: "CustomParentName",
    suffix: "CustomSuffix",
    destroyOriginal: true
  },
  configure_children: { sampleNames: [], sampleDescs: ["CustomDescription1"] }
};

describe("MaterialSample split workflow run action form with all default values", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Display Material Sample workfow run action page based on configuration", async () => {
    const wrapper = mountWithAppContext(<SplitRunAction />, { apiContext });
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".materialSampleName input").prop("value")).toEqual(
      "ParentName-001"
    );
  });

  it("Submit a workflow run action (series mode), correct child sample is sent to be saved ", async () => {
    localStorage.setItem(
      SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY,
      JSON.stringify(testSeriesModeRunConfig)
    );
    const wrapper = mountWithAppContext(<SplitRunAction />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    // child sample initially loaded with user entered custom name
    expect(wrapper.find(".materialSampleName input").prop("value")).toEqual(
      "my custom name"
    );

    wrapper.find("button.copyFromParent").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // child sample will have the parent's value after click copyFromParent
    expect(wrapper.find(".dwcCatalogNumber input").prop("value")).toEqual(
      "my-number"
    );

    wrapper.find("button.runAction").simulate("click");

    // When click next button, child sample is linked to parent sample and sent to save
    expect(mockSave.mock.calls[0]).toEqual([
      [
        {
          resource: {
            dwcCatalogNumber: "my-number",
            group: "aafc",
            materialSampleName: "my custom name",
            parentMaterialSample: {
              id: "1",
              type: "material-sample"
            },
            type: "material-sample"
          },
          type: "material-sample"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    ]);
  });

  it("Submit a workflow run action (batch mode), correct child sample is sent to be saved ", async () => {
    localStorage.setItem(
      SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY,
      JSON.stringify(testBatchModeRunConfig)
    );
    const wrapper = mountWithAppContext(<SplitRunAction />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    // child sample initially loaded with generated custom name
    expect(wrapper.find(".materialSampleName input").prop("value")).toEqual(
      "CustomParentNameCustomSuffix"
    );

    wrapper.find("button.runAction").simulate("click");

    // When click next button, child samples are linked to parent sample and sent to save:
    expect(mockSave.mock.calls[0]).toEqual([
      [
        {
          resource: {
            group: "aafc",
            materialSampleName: "CustomParentNameCustomSuffix",
            parentMaterialSample: {
              id: "1",
              type: "material-sample"
            },
            type: "material-sample"
          },
          type: "material-sample"
        },
        {
          resource: {
            group: "aafc",
            materialSampleName: "CustomParentNameCustomSuffix",
            parentMaterialSample: {
              id: "1",
              type: "material-sample"
            },
            type: "material-sample"
          },
          type: "material-sample"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    ]);
  });
});
