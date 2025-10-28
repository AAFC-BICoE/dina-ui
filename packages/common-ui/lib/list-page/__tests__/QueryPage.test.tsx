import "@testing-library/jest-dom";
import {
  DinaForm,
  mountWithAppContext,
  waitForLoadingToDisappear
} from "common-ui";

import { mockResponses } from "../__mocks__/QueryPageMocks";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import MaterialSampleListPage from "../../../../dina-ui/pages/collection/material-sample/list";

const mockGet = jest.fn<any, any>(async (path) => {
  return mockResponses[path] ?? { data: [] };
});

const mockPost = jest.fn<any, any>(async (path) => {
  return mockResponses[path];
});

const mockBulkGet = jest.fn<any, any>(async (paths) => {
  return paths.map((path) => mockResponses[path] ?? { data: [] });
});

// Mock Next.js router
const mockReload = jest.fn();
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  reload: mockReload,
  pathname: "/collection/material-sample/list",
  query: {},
  asPath: "/collection/material-sample/list"
};

jest.mock("next/router", () => ({
  useRouter: () => mockRouter
}));

const mockDelete = jest.fn();
const mockDoOperations = jest.fn();

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      axios: {
        post: mockPost,
        get: mockGet,
        delete: mockDelete
      }
    },
    bulkGet: mockBulkGet,
    doOperations: mockDoOperations
  }
} as any;

describe("QueryPage test", () => {
  it("Render QueryPage for material-samples", async () => {
    const component = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <MaterialSampleListPage />
      </DinaForm>,
      testCtx
    );
    const reactTable = await component.findByTestId("ReactTable");
    expect(reactTable).toBeInTheDocument();
    expect(reactTable.querySelectorAll("table tbody tr").length).toBe(2);
    expect(
      reactTable.querySelectorAll("table tbody tr")[0].getAttribute("style")
    ).toBeNull();
    expect(
      reactTable.querySelectorAll("table tbody tr")[1].getAttribute("style")
    ).toEqual("opacity: 0.4;");
  });

  it("Bulk Delete button works for material-samples", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <MaterialSampleListPage />
      </DinaForm>,
      testCtx
    );

    const reactTable = await wrapper.findByTestId("ReactTable");
    expect(reactTable).toBeInTheDocument();

    // Click the "Select All" checkbox to select all items
    userEvent.click(
      wrapper.getByRole("checkbox", {
        name: /check all/i
      })
    );

    // Click the Bulk Delete button
    userEvent.click(
      wrapper.getByRole("button", {
        name: /delete selected/i
      })
    );

    await waitFor(() => {
      expect(wrapper.getByText(/delete selected \(2\)/i)).toBeInTheDocument();
    });
    userEvent.click(wrapper.getByRole("button", { name: /yes/i }));
    await waitForLoadingToDisappear();

    // Verify both material samples are deleted
    expect(mockDelete).toHaveBeenNthCalledWith(
      1,
      "/collection-api/material-sample/074e745e-7ef1-449c-965a-9a4dc754391f"
    );
    expect(mockDelete).toHaveBeenNthCalledWith(
      2,
      "/collection-api/material-sample/7c2b6795-02bb-4edd-97af-589527ef3e7f"
    );

    // Verify that only one storage unit usage was deleted (since only one has an attached storage unit)
    expect(mockDoOperations).lastCalledWith(
      [
        {
          op: "DELETE",
          path: "storage-unit-usage/01919485-ed65-7a79-9080-91445b897ef4"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );

    // Verify router.reload() is called at the very end
    await waitFor(() => {
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });
});
