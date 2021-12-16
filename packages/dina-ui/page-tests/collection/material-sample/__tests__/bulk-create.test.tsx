import { ResourceSelect } from "common-ui";
import { MaterialSampleBulkCreatePage } from "../../../../pages/collection/material-sample/bulk-create";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";

const mockPush = jest.fn();

const mockRouter = { push: mockPush, query: {} };

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/collection":
      return { data: [] };
  }
});

const testCtx = {
  apiContext: { apiClient: { get: mockGet } }
};

describe("MaterialSampleBulkCreatePage", () => {
  it("Can click the 'previous' button to go back to the previous step", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkCreatePage router={mockRouter as any} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Use series mode:
    wrapper.find("li.series-tab").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Fill out the form:
    wrapper
      .find(".collection-field")
      .find(ResourceSelect)
      .prop<any>("onChange")({
      id: "100",
      name: "test-collection",
      type: "collection"
    });
    wrapper
      .find(".numberToCreate-field input")
      .simulate("change", { target: { value: "5" } });
    wrapper
      .find(".baseName-field input")
      .simulate("change", { target: { value: "my-sample" } });
    wrapper
      .find(".start-field input")
      .simulate("change", { target: { value: "00001" } });
    wrapper
      .find(".separator-field input")
      .simulate("change", { target: { value: "-" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.previous-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Goes back to the previous page with the generator form values:
    expect(wrapper.find("li.series-tab").hasClass("react-tabs__tab--selected"));
    expect(wrapper.find(".baseName-field input").prop("value")).toEqual(
      "my-sample"
    );
  }, 20000);
});
