import { PersistedResource } from "kitsu";
import { MaterialSample } from "packages/dina-ui/types/collection-api/resources/MaterialSample";
import React from "react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { AssociatedMaterialSampleSearchBox } from "../AssociatedMaterialSampleSearchBox";
import { DinaForm } from "../DinaForm";

const mockOnSubmit = jest.fn();

function testMaterialSample(): PersistedResource<MaterialSample> {
  return {
    id: "1",
    type: "material-sample",
    group: "test group",
    materialSampleName: "my-sample-name"
  };
}

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/material-sample/1":
      return { data: testMaterialSample() };
    case "collection-api/material-sample":
      return { data: [testMaterialSample()] };
    case "collection-api/material-sample-type":
    case "user-api/group":
    case "agent-api/person":
    case "collection-api/vocabulary/srs":
    case "collection-api/vocabulary/coordinateSystem":
    case "collection-api/vocabulary/degreeOfEstablishment":
    case "collection-api/vocabulary/typeStatus":
    case "collection-api/storage-unit-type":
    case "collection-api/storage-unit":
    case "collection-api/collection":
      return { data: [], meta: { totalResourceCount: 0 } };
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet
    }
  }
};

describe("AssociatedMaterialSampleSearchBox component", () => {
  it("Set the association sample id field when select one from search result list .", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <AssociatedMaterialSampleSearchBox name={"associatedSample"} />
      </DinaForm>,
      testCtx
    );

    expect(wrapper.find("button.searchSample")).toBeTruthy();
    wrapper.find("button.searchSample").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    /* click the search button will show the empty associated sample input */
    expect(wrapper.find(".associatedSampleInput").length).toBe(1);

    /* select one sample from search result list */
    wrapper.find("button.selectMaterialSample").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    /* expected the selected sample is being populated to the sample input */
    expect(wrapper.find(".associatedSampleInput").text()).toEqual(
      "my-sample-name"
    );
  });
});
