import { writeStorage } from "@rehooks/local-storage";
import { DEFAULT_GROUP_STORAGE_KEY } from "../../../../components/group-select/useStoredDefaultGroup";
import { MaterialSampleBulkCreatePage } from "../../../../pages/collection/material-sample/bulk-create";
import { mountWithAppContext } from "common-ui";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

// Mock out the dynamic component, which should only be rendered in the browser
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent() {
    return <div>Mock dynamic component</div>;
  };
});

const mockPush = jest.fn();

const mockRouter = { push: mockPush, query: {} };

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/collection":
      return {
        data: [
          {
            id: "100",
            name: "test collection",
            type: "collection"
          }
        ]
      };
    case "collection-api/material-sample":
    case "objectstore-api/metadata":
    case "collection-api/managed-attribute":
    case "collection-api/material-sample-type":
    case "collection-api/project":
    case "collection-api/vocabulary2/materialSampleState":
    case "user-api/group":
      return { data: [] };
  }
});

const testCtx = {
  apiContext: { apiClient: { get: mockGet } }
};

describe("MaterialSampleBulkCreatePage", () => {
  beforeEach(jest.clearAllMocks);

  beforeEach(() => {
    // Set the deault group selection:
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "aafc");
    jest.clearAllMocks();
  });

  it("Can click the 'previous' button to go back to the previous step", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkCreatePage router={mockRouter as any} />,
      testCtx
    );

    await new Promise(setImmediate);

    // Fill out the form:
    // Collection field
    userEvent.click(wrapper.getByRole("combobox", { name: /collection/i }));
    userEvent.click(wrapper.getByRole("option", { name: /test collection/i }));
    // Material Samples to Create field
    fireEvent.change(
      wrapper.getByRole("spinbutton", { name: /material samples to create/i }),
      {
        target: {
          value: 5
        }
      }
    );
    // Base Name field
    fireEvent.change(wrapper.getByRole("textbox", { name: /base name/i }), {
      target: {
        value: "my-sample"
      }
    });
    // Start field
    fireEvent.change(wrapper.getByRole("textbox", { name: /start/i }), {
      target: {
        value: "00001"
      }
    });
    // Sperator field
    fireEvent.change(wrapper.getByRole("textbox", { name: /separator/i }), {
      target: {
        value: "-"
      }
    });

    await new Promise(setImmediate);

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await new Promise(setImmediate);

    // Click 'Go to the previous step' button
    userEvent.click(
      wrapper.getByRole("button", { name: /go to the previous step/i })
    );

    await new Promise(setImmediate);

    // Goes back to the previous page with the generator form values:
    expect(wrapper.getByText("test collection")).toBeInTheDocument();
    expect(
      wrapper.getByRole("spinbutton", { name: /material samples to create/i })
    ).toHaveDisplayValue("5");
    expect(
      wrapper.getByRole("textbox", { name: /base name/i })
    ).toHaveDisplayValue("my-sample");
    expect(wrapper.getByRole("textbox", { name: /start/i })).toHaveDisplayValue(
      "00001"
    );
    expect(
      wrapper.getByRole("textbox", { name: /separator/i })
    ).toHaveDisplayValue("-");
  });
});
