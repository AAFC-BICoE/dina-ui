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
    acceptedValues: Array.from({ length: 12 }, (_, i) => `value ${i + 1}`),
    controlledVocabulary: { id: "managed-attribute-id" }
  },
  {
    id: "item-3",
    type: "controlled-vocabulary-item",
    name: "Event attribute",
    dinaComponent: "COLLECTING_EVENT",
    multilingualTitle: {
      titles: [
        { lang: "fr", title: "Attribut d'événement" },
        { lang: "en", title: "Event Attribute Title" }
      ]
    },
    controlledVocabulary: { id: "managed-attribute-id" }
  },
  {
    id: "item-4",
    type: "controlled-vocabulary-item",
    name: "Attribute without component",
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
      return { data: TEST_ITEMS, meta: { totalResourceCount: 4 } };
    default:
      return { data: [] };
  }
});

const apiContext: any = { apiClient: { get: mockGet } };

describe("Controlled vocabulary list page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // The filter form is kept in local storage.
    localStorage.clear();
  });

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

  it("Shows accepted values as badges, hiding those past the limit.", async () => {
    const wrapper = mountWithAppContext(<ControlledVocabularyListPage />, {
      apiContext
    });

    // Wait for the sidebar to load, which re-renders the table:
    await waitFor(() =>
      expect(wrapper.getByLabelText("Material Sample")).toBeChecked()
    );

    expect(await wrapper.findByText("value 1")).toHaveClass("badge");
    expect(wrapper.getByText("value 7")).toBeInTheDocument();
    expect(wrapper.queryByText("value 8")).not.toBeInTheDocument();

    await userEvent.click(wrapper.getByRole("button", { name: "Show More" }));
    expect(wrapper.getByText("value 12")).toBeInTheDocument();

    await userEvent.click(wrapper.getByRole("button", { name: "Show Less" }));
    expect(wrapper.queryByText("value 8")).not.toBeInTheDocument();
  });

  it("Shows the title in the user's language as the name, falling back to the name.", async () => {
    const wrapper = mountWithAppContext(<ControlledVocabularyListPage />, {
      apiContext
    });

    expect(
      await wrapper.findByText("Event Attribute Title")
    ).toBeInTheDocument();
    expect(wrapper.queryByText("Event attribute")).not.toBeInTheDocument();
    expect(wrapper.queryByText("Attribut d'événement")).not.toBeInTheDocument();
    expect(wrapper.getByText("Has vector")).toBeInTheDocument();
  });

  it("Counts and filters items without a data component.", async () => {
    const wrapper = mountWithAppContext(<ControlledVocabularyListPage />, {
      apiContext
    });

    await waitFor(() =>
      expect(wrapper.getByLabelText("No Data Component")).toBeChecked()
    );

    // Deselecting a component keeps the items without one, filtered in memory:
    await userEvent.click(wrapper.getByLabelText("Collecting Event"));

    await waitFor(() =>
      expect(
        wrapper.queryByText("Event Attribute Title")
      ).not.toBeInTheDocument()
    );
    expect(
      wrapper.getByText("Attribute without component")
    ).toBeInTheDocument();
    expect(wrapper.getByText("Sample attribute")).toBeInTheDocument();
    expect(wrapper.getByText("Has vector")).toBeInTheDocument();

    // Deselecting "No Data Component" hides them:
    await userEvent.click(wrapper.getByLabelText("No Data Component"));
    await waitFor(() =>
      expect(
        wrapper.queryByText("Attribute without component")
      ).not.toBeInTheDocument()
    );
    expect(wrapper.getByText("Sample attribute")).toBeInTheDocument();
  });

  it("Updates the sidebar counts when the filter form changes.", async () => {
    const wrapper = mountWithAppContext(<ControlledVocabularyListPage />, {
      apiContext
    });
    const countOf = (label: string) =>
      wrapper.getByLabelText(label).closest("li")?.querySelector(".badge")
        ?.textContent;

    await waitFor(() => expect(countOf("Managed Attribute")).toEqual("3"));
    expect(countOf("Collecting Event")).toEqual("1");
    expect(countOf("Association Type")).toEqual("1");

    await userEvent.type(
      wrapper.getByPlaceholderText("Search by name, key, unit or creator"),
      "sample"
    );
    await userEvent.click(wrapper.getByRole("button", { name: /Filter List/ }));

    await waitFor(() => expect(countOf("Managed Attribute")).toEqual("1"));
    expect(countOf("Material Sample")).toEqual("1");
    // Zero counts hide the badge:
    expect(countOf("Collecting Event")).toBeUndefined();
    expect(countOf("Association Type")).toBeUndefined();
  });
});
