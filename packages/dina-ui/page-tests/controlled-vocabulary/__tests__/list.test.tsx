import ControlledVocabularyListPage from "../../../pages/controlled-vocabulary/list";
import { mountWithAppContext } from "common-ui";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

jest.mock("next/router", () => ({
  useRouter: () => ({ query: {}, push: jest.fn() })
}));

const TEST_VOCABULARIES = [
  {
    id: "association-type-id",
    type: "controlled-vocabulary",
    name: "Association Type",
    key: "association_type"
  },
  {
    id: "managed-attribute-id",
    type: "controlled-vocabulary",
    name: "Managed Attribute",
    key: "managed_attribute"
  }
];

const TEST_ITEMS = [
  {
    id: "item-1",
    type: "controlled-vocabulary-item",
    name: "Has vector",
    controlledVocabulary: { id: "association-type-id" }
  },
  {
    id: "item-2",
    type: "controlled-vocabulary-item",
    name: "Sample attribute",
    dinaComponent: "MATERIAL_SAMPLE",
    controlledVocabulary: { id: "managed-attribute-id" }
  },
  {
    id: "item-3",
    type: "controlled-vocabulary-item",
    name: "Event attribute",
    dinaComponent: "COLLECTING_EVENT",
    controlledVocabulary: { id: "managed-attribute-id" }
  }
];

/** Whether a request is the sidebar's request for every item's vocabulary and component. */
function isSidebarItemsRequest(path: string, params: any) {
  return (
    path === "/collection-api/controlled-vocabulary-item" &&
    params?.fields?.["controlled-vocabulary"] === "id"
  );
}

const mockGet = jest.fn<any, any>(async (path: string) => {
  switch (path) {
    case "/collection-api/controlled-vocabulary":
      return { data: TEST_VOCABULARIES };
    case "/collection-api/controlled-vocabulary-item":
      return { data: TEST_ITEMS, meta: { totalResourceCount: 3 } };
    default:
      return { data: [] };
  }
});

const apiContext: any = { apiClient: { get: mockGet } };

describe("Controlled vocabulary list page", () => {
  beforeEach(jest.clearAllMocks);

  it("Selects every vocabulary and data component by default.", async () => {
    const wrapper = mountWithAppContext(<ControlledVocabularyListPage />, {
      apiContext
    });

    await waitFor(() =>
      expect(wrapper.getByLabelText("Material Sample")).toBeChecked()
    );
    expect(wrapper.getByLabelText("Collecting Event")).toBeChecked();
    expect(wrapper.getByLabelText("All")).toBeChecked();
    expect(wrapper.getByLabelText("All Types")).toBeChecked();
    expect(wrapper.getByLabelText("Association Type")).toBeChecked();
    expect(wrapper.getByLabelText("Managed Attribute")).toBeChecked();

    // Everything selected is the same as no type filter:
    const tableRequests = mockGet.mock.calls.filter(
      ([path, params]) =>
        path === "/collection-api/controlled-vocabulary-item" &&
        !isSidebarItemsRequest(path, params)
    );
    expect(tableRequests[tableRequests.length - 1][1].filter).toBeUndefined();
  });

  it("Loads the sidebar items once and keeps the user's selection.", async () => {
    const wrapper = mountWithAppContext(<ControlledVocabularyListPage />, {
      apiContext
    });

    await waitFor(() =>
      expect(wrapper.getByLabelText("Material Sample")).toBeChecked()
    );

    await userEvent.click(wrapper.getByLabelText("Association Type"));

    // Let any further renders and requests settle:
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.getByLabelText("Association Type")).not.toBeChecked();
    expect(
      mockGet.mock.calls.filter(([path, params]) =>
        isSidebarItemsRequest(path, params)
      )
    ).toHaveLength(1);
  });
});
