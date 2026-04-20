import "@testing-library/jest-dom";
import {
  DinaForm,
  mountWithAppContext,
  waitForLoadingToDisappear
} from "common-ui";
import { mockResponses, mockResponsesTabs } from "../__mocks__/QueryPageMocks";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import MaterialSampleListPage from "../../../../dina-ui/pages/collection/material-sample/list";
import "@testing-library/jest-dom";
import { QueryPage } from "common-ui";
import { KitsuResource } from "kitsu";
import React from "react";
import { QueryPageTabProps } from "../QueryPage";

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

    // Samples with a material sample state should be styled with reduced opacity
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
    await waitForLoadingToDisappear();

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

    await waitForLoadingToDisappear();
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

    await waitFor(() => {
      expect(
        wrapper.getByText(/records have been successfully deleted\./i)
      ).toBeInTheDocument();
    });

    // Click the "Close" button.
    userEvent.click(wrapper.getByRole("button", { name: /close/i }));

    // Verify router.reload() is called at the very end
    await waitFor(() => {
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });
});

interface TestResource extends KitsuResource {
  id: string;
  name: string;
}

// Simple mock tab components
const Tab1 = ({ data }: QueryPageTabProps<TestResource>) => (
  <div data-testid="tab-1-content">Tab 1 - {data?.length || 0} items</div>
);

const Tab2 = ({ data }: QueryPageTabProps<TestResource>) => (
  <div data-testid="tab-2-content">Tab 2 - {data?.length || 0} items</div>
);

describe("QueryPage test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockImplementationOnce(async (path) => mockResponses[path]);
    localStorage.clear();
  });
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

    // Samples with a material sample state should be styled with reduced opacity
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
    await waitForLoadingToDisappear();

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

    await waitForLoadingToDisappear();
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

    await waitFor(() => {
      expect(
        wrapper.getByText(/records have been successfully deleted\./i)
      ).toBeInTheDocument();
    });

    // Click the "Close" button.
    userEvent.click(wrapper.getByRole("button", { name: /close/i }));

    // Verify router.reload() is called at the very end
    await waitFor(() => {
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });
});

const COLUMNS = [
  {
    id: "name",
    header: "Name",
    accessorKey: "name"
  }
];

describe("QueryPage Tab Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockImplementationOnce(async (path) => mockResponsesTabs[path]);
    localStorage.clear();
  });

  describe("Without Tabs", () => {
    it("Should render normal table when tabs are not provided", async () => {
      const component = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryPage<TestResource>
            indexName="test_index"
            uniqueName="test-list"
            columns={COLUMNS as any}
          />
        </DinaForm>,
        testCtx
      );

      await waitForLoadingToDisappear();

      expect(component.queryByRole("tablist")).not.toBeInTheDocument();
      expect(component.getByTestId("ReactTable")).toBeInTheDocument();
    });

    it("Should not render tab navigation when tabs array is empty", async () => {
      const component = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryPage<TestResource>
            indexName="test_index"
            uniqueName="test-list"
            columns={COLUMNS as any}
            tabs={[]}
          />
        </DinaForm>,
        testCtx
      );

      await waitForLoadingToDisappear();

      expect(component.queryByRole("tablist")).not.toBeInTheDocument();
      expect(component.getByTestId("ReactTable")).toBeInTheDocument();
    });
  });

  describe("Tab Rendering", () => {
    it("Should render all tabs when provided", async () => {
      const tabs = [
        { id: "tab1", labelKey: "listView", component: Tab1 },
        { id: "tab2", labelKey: "galleryView", component: Tab2 }
      ];

      const component = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryPage<TestResource>
            indexName="test_index"
            uniqueName="test-tabs-list"
            columns={COLUMNS as any}
            tabs={tabs as any}
          />
        </DinaForm>,
        testCtx
      );

      await waitForLoadingToDisappear();

      expect(component.getByRole("tablist")).toBeInTheDocument();
      expect(component.getByRole("tab", { name: /list/i })).toBeInTheDocument();
      expect(
        component.getByRole("tab", { name: /gallery/i })
      ).toBeInTheDocument();
    });

    it("Should render single tab", async () => {
      const tabs = [{ id: "tab1", labelKey: "listView", component: Tab1 }];

      const component = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryPage<TestResource>
            indexName="test_index"
            uniqueName="test-single-tab-list"
            columns={COLUMNS as any}
            tabs={tabs as any}
          />
        </DinaForm>,
        testCtx
      );

      await waitForLoadingToDisappear();

      expect(component.getByRole("tablist")).toBeInTheDocument();
      expect(component.getByRole("tab", { name: /list/i })).toBeInTheDocument();
      expect(component.getByTestId("tab-1-content")).toBeInTheDocument();
    });
  });

  describe("Default Tab Selection", () => {
    it("Should display first tab by default", async () => {
      const tabs = [
        { id: "tab1", labelKey: "listView", component: Tab1 },
        { id: "tab2", labelKey: "galleryView", component: Tab2 }
      ];

      const component = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryPage<TestResource>
            indexName="test_index"
            uniqueName="test-default-first-tab"
            columns={COLUMNS as any}
            tabs={tabs as any}
          />
        </DinaForm>,
        testCtx
      );

      await waitForLoadingToDisappear();

      const firstTab = component.getByRole("tab", { name: /list/i });

      expect(firstTab).toHaveClass("react-tabs__tab--selected");
      expect(component.getByTestId("tab-1-content")).toBeInTheDocument();
      expect(component.queryByTestId("tab-2-content")).not.toBeInTheDocument();
    });

    it("Should display specified default tab", async () => {
      const tabs = [
        { id: "tab1", labelKey: "listView", component: Tab1 },
        { id: "tab2", labelKey: "galleryView", component: Tab2 }
      ];

      const component = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryPage<TestResource>
            indexName="test_index"
            uniqueName="test-default-tab2"
            columns={COLUMNS as any}
            tabs={tabs as any}
            defaultTab="tab2"
          />
        </DinaForm>,
        testCtx
      );

      await waitForLoadingToDisappear();

      const secondTab = component.getByRole("tab", { name: /gallery/i });
      expect(secondTab).toHaveClass("react-tabs__tab--selected");
      expect(component.getByTestId("tab-2-content")).toBeInTheDocument();
      expect(component.queryByTestId("tab-1-content")).not.toBeInTheDocument();
    });

    it("Should fall back to first tab if invalid default tab is specified", async () => {
      const tabs = [
        { id: "tab1", labelKey: "listView", component: Tab1 },
        { id: "tab2", labelKey: "galleryView", component: Tab2 }
      ];

      const component = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryPage<TestResource>
            indexName="test_index"
            uniqueName="test-invalid-default-tab"
            columns={COLUMNS as any}
            tabs={tabs as any}
            defaultTab="invalid-tab"
          />
        </DinaForm>,
        testCtx
      );

      await waitForLoadingToDisappear();

      const firstTab = component.getByRole("tab", { name: /list/i });

      expect(firstTab).toHaveClass("react-tabs__tab--selected");
      expect(component.getByTestId("tab-1-content")).toBeInTheDocument();
    });
  });

  describe("Tab Clicking", () => {
    it("Should switch to tab 2 when clicked", async () => {
      const tabs = [
        { id: "tab1", labelKey: "listView", component: Tab1 },
        { id: "tab2", labelKey: "galleryView", component: Tab2 }
      ];

      const component = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryPage<TestResource>
            indexName="test_index"
            uniqueName="test-click-tab2"
            columns={COLUMNS as any}
            tabs={tabs as any}
          />
        </DinaForm>,
        testCtx
      );

      await waitForLoadingToDisappear();

      expect(component.getByTestId("tab-1-content")).toBeInTheDocument();

      const tab2Button = component.getByRole("tab", { name: /gallery/i });
      userEvent.click(tab2Button);

      await waitFor(() => {
        expect(tab2Button).toHaveClass("react-tabs__tab--selected");
        expect(component.getByTestId("tab-2-content")).toBeInTheDocument();
        expect(
          component.queryByTestId("tab-1-content")
        ).not.toBeInTheDocument();
      });
    });

    it("Should switch between tabs multiple times", async () => {
      const tabs = [
        { id: "tab1", labelKey: "listView", component: Tab1 },
        { id: "tab2", labelKey: "galleryView", component: Tab2 }
      ];

      const component = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryPage<TestResource>
            indexName="test_index"
            uniqueName="test-multiple-clicks"
            columns={COLUMNS as any}
            tabs={tabs as any}
          />
        </DinaForm>,
        testCtx
      );

      await waitForLoadingToDisappear();

      const tab2Button = component.getByRole("tab", { name: /gallery/i });
      userEvent.click(tab2Button);

      await waitFor(() => {
        expect(component.getByTestId("tab-2-content")).toBeInTheDocument();
      });

      const tab1Button = component.getByRole("tab", { name: /list/i });
      userEvent.click(tab1Button);

      await waitFor(() => {
        expect(component.getByTestId("tab-1-content")).toBeInTheDocument();
      });
    });
  });

  describe("Tab Props Passing", () => {
    it("Should pass data to tab component", async () => {
      const tabs = [{ id: "tab1", labelKey: "listView", component: Tab1 }];

      const component = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryPage<TestResource>
            indexName="test_index"
            uniqueName="test-data-passing"
            columns={COLUMNS as any}
            tabs={tabs as any}
          />
        </DinaForm>,
        testCtx
      );

      await waitForLoadingToDisappear();

      expect(component.getByTestId("tab-1-content")).toHaveTextContent(
        "Tab 1 - 2 items"
      );
    });
  });

  describe("Tab Persistence", () => {
    it("Should persist selected tab in localStorage", async () => {
      const tabs = [
        { id: "tab1", labelKey: "listView", component: Tab1 },
        { id: "tab2", labelKey: "galleryView", component: Tab2 }
      ];

      const component = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryPage<TestResource>
            indexName="test_index"
            uniqueName="test-persistence"
            columns={COLUMNS as any}
            tabs={tabs as any}
          />
        </DinaForm>,
        testCtx
      );

      await waitForLoadingToDisappear();

      const tab2Button = component.getByRole("tab", { name: /gallery/i });
      userEvent.click(tab2Button);

      await waitFor(() => {
        expect(component.getByTestId("tab-2-content")).toBeInTheDocument();
      });

      const storedTabIndex = localStorage.getItem(
        "test-persistence-active-tab-index"
      );
      expect(storedTabIndex).toBe("1");
    });
  });
});
