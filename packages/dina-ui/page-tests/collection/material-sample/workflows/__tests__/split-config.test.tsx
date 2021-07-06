import {
  BASE_NAME,
  START,
  TYPE_NUMERIC
} from "../../../../../../dina-ui/types/collection-api";
import Select from "react-select";
import ConfigAction, {
  SPLIT_CHILD_SAMPLE_RUN_CONFIG_KEY
} from "../../../../../pages/collection/material-sample/workflows/split-config";
import { mountWithAppContext } from "../../../../../test-util/mock-app-context";

const mockUseRouter = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => mockUseRouter()
}));

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
    configure_children: { sampleNames: ["my custom name"], sampleDescs: [] }
  }
};

describe("MaterialSample split workflow run config", () => {
  it("Initially display the workfow run config with defaults", async () => {
    const wrapper = mountWithAppContext(<ConfigAction />, {});

    expect(wrapper.find(".baseName-field input").prop("placeholder")).toEqual(
      BASE_NAME
    );

    expect(wrapper.find(".start-field input").prop("value")).toEqual(START);

    const value = wrapper.find(".suffixType Select").prop("value");
    expect(value).toEqual({ label: "Numerical", value: TYPE_NUMERIC });
  });

  it("Creates a new Material Sample workfow run config with user custom entries", async () => {
    const wrapper = mountWithAppContext(<ConfigAction />, {});

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
});
