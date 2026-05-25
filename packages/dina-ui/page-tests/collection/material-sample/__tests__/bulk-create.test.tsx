import { writeStorage } from "@rehooks/local-storage";
import { DEFAULT_GROUP_STORAGE_KEY } from "../../../../components/group-select/useStoredDefaultGroup";
import { MaterialSampleBulkCreatePage } from "../../../../pages/collection/material-sample/bulk-create";
import { mountWithAppContext } from "common-ui";
import { fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { useSearchWsCustomQuery } from "../../../../../common-ui/lib/search/useSearchWsCustomQuery";

// Mock out the dynamic component, which should only be rendered in the browser
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent() {
    return <div>Mock dynamic component</div>;
  };
});

/**
 * Reusable mock block for tests that render components using `useSearchWsCustomQuery`.
 * Copy this block into other test files to avoid real search-ws API calls.
 */
jest.mock("../../../../../common-ui/lib/search/useSearchWsCustomQuery", () => {
  const actual = jest.requireActual(
    "../../../../../common-ui/lib/search/useSearchWsCustomQuery"
  );
  return {
    ...actual,
    useSearchWsCustomQuery: jest
      .fn()
      .mockReturnValue({ loading: false, response: { data: [] } })
  };
});

function mockUseSearchWsResults(data: unknown[] = []) {
  (useSearchWsCustomQuery as jest.Mock).mockReturnValue({
    loading: false,
    response: { data }
  });
}

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
  beforeEach(() => {
    // Set the deault group selection:
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "aafc");
    jest.clearAllMocks();
    mockUseSearchWsResults();
  });

  it("Can click the 'previous' button to go back to the previous step", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkCreatePage router={mockRouter as any} />,
      testCtx
    );

    await waitFor(() => {
      expect(
        wrapper.getByRole("combobox", { name: /collection/i })
      ).toBeInTheDocument();
    });

    // Fill out the form:
    // Collection field
    userEvent.click(wrapper.getByRole("combobox", { name: /collection/i }));

    await waitFor(() => {
      expect(
        wrapper.getByRole("option", { name: /test collection/i })
      ).toBeInTheDocument();
    });
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

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Click 'Go to the previous step' button
    await waitFor(() => {
      expect(
        wrapper.getByRole("button", { name: /go to the previous step/i })
      ).toBeInTheDocument();
    });
    userEvent.click(
      wrapper.getByRole("button", { name: /go to the previous step/i })
    );

    // Goes back to the previous page with the generator form values:
    await waitFor(() => {
      expect(wrapper.getByText("test collection")).toBeInTheDocument();
      expect(
        wrapper.getByRole("spinbutton", { name: /material samples to create/i })
      ).toHaveDisplayValue("5");
      expect(
        wrapper.getByRole("textbox", { name: /base name/i })
      ).toHaveDisplayValue("my-sample");
      expect(
        wrapper.getByRole("textbox", { name: /start/i })
      ).toHaveDisplayValue("00001");
      expect(
        wrapper.getByRole("textbox", { name: /separator/i })
      ).toHaveDisplayValue("-");
    });
  });
});
