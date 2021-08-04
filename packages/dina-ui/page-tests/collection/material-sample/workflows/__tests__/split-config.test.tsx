import {
  BASE_NAME,
  START,
  TYPE_NUMERIC
} from "../../../../../../dina-ui/types/collection-api";
import ConfigAction, {
  SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY
} from "../../../../../pages/collection/material-sample/workflows/split-config";
import { mountWithAppContext } from "../../../../../test-util/mock-app-context";

const testRunConfig = {
  "split-child-sample-run-config": {
    metadata: { actionRemarks: "Remarks on this run config" },
    configure: {
      numOfChildToCreate: "1",
      baseName: "Custom Parent Name",
      start: "10",
      type: "Numerical",
      destroyOriginal: true
    },
    configure_children: { sampleNames: ["my custom name"] }
  }
};

const testMaterialSample = {
  id: "123",
  type: "material-sample",
  dwcCatalogNumber: "my-number"
};

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/material-sample/123":
      return {
        data: testMaterialSample
      };
  }
});

const apiContext = {
  apiClient: {
    get: mockGet
  }
};

describe("MaterialSample split workflow series-mode run config", () => {
  it("Initially display the workfow run config with defaults", async () => {
    const wrapper = mountWithAppContext(
      <ConfigAction router={{ query: { id: undefined } } as any} />,
      { apiContext }
    );

    // Switch to the "Series" tab:
    wrapper.find("li.react-tabs__tab.series-tab").simulate("click");

    expect(wrapper.find(".baseName-field input").prop("placeholder")).toEqual(
      BASE_NAME
    );

    expect(wrapper.find(".start-field input").prop("value")).toEqual(START);

    expect(wrapper.find(".suffixType-field Select").prop("value")).toEqual({
      label: "Numerical",
      value: TYPE_NUMERIC
    });
  });

  it("Creates a new Material Sample workfow series-mode run config with user custom entries", async () => {
    const wrapper = mountWithAppContext(
      <ConfigAction router={{ query: { id: undefined } } as any} />,
      { apiContext }
    );

    // Switch to the "Series" tab:
    wrapper.find("li.react-tabs__tab.series-tab").simulate("click");

    wrapper
      .find(".baseName-field input")
      .simulate("change", { target: { value: "Custom Parent Name" } });

    wrapper
      .find(".start-field input")
      .simulate("change", { target: { value: "10" } });

    wrapper
      .find(".remarks-field textarea")
      .simulate("change", { target: { value: "Remarks on this run config" } });

    wrapper
      .find(".sampleName0 input")
      .simulate("change", { target: { value: "my custom name" } });

    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // item exists with the key
    expect(
      localStorage.getItem(SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY)?.length
    ).toBeGreaterThan(0);

    // content contains the values user set
    expect(localStorage.getItem(SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY)).toContain(
      testRunConfig[SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY].metadata.actionRemarks
    );
    expect(localStorage.getItem(SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY)).toContain(
      testRunConfig[SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY].configure.baseName
    );
    expect(localStorage.getItem(SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY)).toContain(
      testRunConfig[SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY].configure_children
        .sampleNames[0]
    );
  });

  it("Creates a new Material Sample workfow batch-mode run config with user custom entries", async () => {
    const wrapper = mountWithAppContext(
      <ConfigAction router={{ query: { id: undefined } } as any} />,
      { apiContext }
    );

    // Switch to the "Batch" tab:
    wrapper.find("li.react-tabs__tab.batch-tab").simulate("click");

    wrapper
      .find(".baseName-field input")
      .simulate("change", { target: { value: "TestBaseName" } });

    wrapper
      .find(".suffix-field input")
      .simulate("change", { target: { value: "TestSuffix" } });

    wrapper
      .find(".numOfChildToCreate-field input")
      .simulate("change", { target: { value: 3 } });

    wrapper
      .find(".sampleName0 input")
      .simulate("change", { target: { value: "CustomName1" } });

    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      JSON.parse(
        localStorage.getItem(SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY) ?? "{}"
      )
    ).toEqual({
      configure: {
        baseName: "TestBaseName",
        generationMode: "BATCH",
        identifier: "MATERIAL_SAMPLE_ID",
        numOfChildToCreate: 3,
        suffix: "TestSuffix"
      },
      configure_children: {
        sampleNames: ["CustomName1", null, null]
      },
      metadata: {}
    });
  });

  it("When come from material sample view page, baseName is set with parent sample name", async () => {
    const wrapper = mountWithAppContext(
      <ConfigAction router={{ query: { id: "123" } } as any} />,
      { apiContext }
    );
    await new Promise(setImmediate);
    wrapper.update();
    expect(wrapper.find(".baseName-field input").prop("value")).toEqual(
      "my-number"
    );
  });
});
