import { DinaForm } from "common-ui";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { TagSelectField } from "../TagSelectField";
import CreatableSelect from "react-select/creatable";

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/material-sample":
      return {
        data: [
          {
            tags: [
              "example-tag-1",
              "example-tag-2",
              "example-tag-3",
              // include duplicate tag which should be removed:
              "example-tag-3",
            ],
          },
          {
            // include null tags which should be removed:
            tags: null,
          },
        ],
      };
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
    },
  },
};

describe("TagSelectField", () => {
  it("Lets you select tags from previous values.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <TagSelectField
          name="tags"
          resourcePath="collection-api/material-sample"
        />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGet).lastCalledWith("collection-api/material-sample", {
      fields: { "material-sample": "tags" }, // Only request tags field.
      filter: { rsql: "group=in=(aafc,cnc)", tags: { NEQ: "null" } }, // Restrict to user's groups
      page: { limit: 100 },
      sort: "-createdOn", // Newest first
    });

    expect(wrapper.find(CreatableSelect).prop("options")).toEqual([
      {
        label: "Type New Tag or Search Previous Tags",
        options: [
          {
            label: "example-tag-1",
            value: "example-tag-1",
          },
          {
            label: "example-tag-2",
            value: "example-tag-2",
          },
          {
            label: "example-tag-3",
            value: "example-tag-3",
          },
        ],
      },
    ]);
  });

  it("Lets you type in new tags.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <TagSelectField
          name="tags"
          resourcePath="collection-api/material-sample"
        />
      </DinaForm>,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(CreatableSelect).prop<any>("onChange")([
      { value: "my-tag-1" },
    ]);

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(CreatableSelect).prop("value")).toEqual([
      { label: "my-tag-1", value: "my-tag-1" },
    ]);
  });
});
