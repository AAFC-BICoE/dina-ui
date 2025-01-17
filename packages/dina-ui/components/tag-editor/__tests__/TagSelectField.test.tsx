import { DinaForm } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { TagSelectField } from "../TagSelectField";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

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
              "example-tag-3"
            ]
          },
          {
            // include null tags which should be removed:
            tags: null
          }
        ]
      };
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet
    }
  }
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

    await wrapper.waitForRequests();

    expect(mockGet).lastCalledWith("collection-api/material-sample", {
      fields: { "material-sample": "tags" }, // Only request tags field.
      filter: { rsql: "group=in=(aafc,cnc)", tags: { NEQ: "null" } }, // Restrict to user's groups
      page: { limit: 100 },
      sort: "-createdOn" // Newest first
    });

    // Test expected combobox
    expect(
      wrapper.getByRole("combobox", {
        name: /tags type new tag or search previous tags/i
      })
    ).toBeInTheDocument();

    userEvent.click(
      wrapper.getByRole("combobox", {
        name: /tags type new tag or search previous tags/i
      })
    );

    // Test expected combobox options
    expect(
      wrapper.getByRole("option", { name: /example\-tag\-1/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("option", { name: /example\-tag\-2/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("option", { name: /example\-tag\-3/i })
    ).toBeInTheDocument();
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

    await wrapper.waitForRequests();

    // Change combobox value
    fireEvent.change(
      wrapper.getByRole("combobox", {
        name: /tags type new tag or search previous tags/i
      }),
      {
        target: {
          value: "my-tag-1"
        }
      }
    );

    await wrapper.waitForRequests();

    // Test expected option in the combobox
    expect(
      wrapper.getByRole("option", { name: /add "my\-tag\-1"/i })
    ).toBeInTheDocument();
  });
});
