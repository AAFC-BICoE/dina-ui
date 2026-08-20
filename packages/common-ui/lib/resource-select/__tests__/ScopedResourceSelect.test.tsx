import "@testing-library/jest-dom";
import { fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mountWithAppContext } from "common-ui";
import { KitsuResource } from "kitsu";
import React from "react";
import {
  ScopedResourceSelect,
  ScopedResourceSelectProps,
  ScopeOption
} from "../ScopedResourceSelect";

interface Todo extends KitsuResource {
  name: string;
  status?: "active" | "completed";
}

const MOCK_TODOS = {
  data: [
    { id: "1", type: "todo", name: "todo 1", status: "active" },
    { id: "2", type: "todo", name: "todo 2", status: "completed" },
    { id: "3", type: "todo", name: "todo 3", status: "active" }
  ] as Todo[]
};

const mockGet = jest.fn(async (_, {}) => MOCK_TODOS);

const apiContext = {
  apiClient: {
    get: mockGet
  }
} as any;

// Mock out debounce to evaluate queries immediately
jest.mock("use-debounce", () => ({
  useDebounce: (val) => [val, { isPending: () => false }]
}));

describe("ScopedResourceSelect component", () => {
  // Updated MOCK_SCOPES to match the new ToggleScopeOption interface
  const MOCK_SCOPES: ScopeOption<Todo>[] = [
    {
      id: "statusFilter",
      type: "toggle",
      label: "Status",
      options: [
        {
          id: "all",
          label: "All Todos",
          applyFilter: () => {}
        },
        {
          id: "active",
          label: "Active Only",
          applyFilter: (builder) => builder.where("status", "EQ", "active")
        }
      ]
    }
  ];

  // Updated model prop to apiEndpoint
  const DEFAULT_SELECT_PROPS: ScopedResourceSelectProps<Todo> = {
    apiEndpoint: "todo-api/todo",
    searchField: "name",
    scopes: MOCK_SCOPES,
    optionLabel: (todo) => todo.name
  };

  function mountWithContext(element: React.JSX.Element) {
    return mountWithAppContext(element, { apiContext });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Fetches and displays initial resource options", async () => {
    const wrapper = mountWithContext(
      <ScopedResourceSelect {...DEFAULT_SELECT_PROPS} />
    );

    await waitFor(() => {
      expect(wrapper.getByText(/select item\.\.\./i)).toBeInTheDocument();
    });

    await userEvent.click(wrapper.getByText(/select item\.\.\./i));

    await waitFor(() => {
      const options = wrapper.getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options.map((o) => o.textContent)).toEqual([
        "todo 1",
        "todo 2",
        "todo 3"
      ]);
    });
  });

  it("Renders sticky scope filter buttons inside the menu", async () => {
    const wrapper = mountWithContext(
      <ScopedResourceSelect {...DEFAULT_SELECT_PROPS} />
    );

    await userEvent.click(wrapper.getByText(/select item\.\.\./i));

    await waitFor(() => {
      // Look for the optional label we defined in MOCK_SCOPES
      expect(wrapper.getByText("Status")).toBeInTheDocument();
      expect(
        wrapper.getByRole("button", { name: "All Todos" })
      ).toBeInTheDocument();
      expect(
        wrapper.getByRole("button", { name: "Active Only" })
      ).toBeInTheDocument();
    });
  });

  it("Applies selected scope filter and triggers a new API request", async () => {
    const wrapper = mountWithContext(
      <ScopedResourceSelect {...DEFAULT_SELECT_PROPS} />
    );

    // Initial fetch using default scope ("all" because it's index 0 of the toggle)
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("todo-api/todo", {
        filter: {},
        page: { limit: 10 },
        sort: "-createdOn"
      });
    });

    await userEvent.click(wrapper.getByText(/select item\.\.\./i));

    const activeScopeBtn = wrapper.getByRole("button", { name: "Active Only" });
    await userEvent.click(activeScopeBtn);

    // Verifies new fetch with active scope filter applied
    await waitFor(() => {
      expect(mockGet).lastCalledWith("todo-api/todo", {
        filter: { status: { EQ: "active" } },
        page: { limit: 10 },
        sort: "-createdOn"
      });
    });
  });

  it("Applies search input filtering via searchField", async () => {
    const wrapper = mountWithContext(
      <ScopedResourceSelect {...DEFAULT_SELECT_PROPS} />
    );

    await waitFor(() => {
      expect(wrapper.getByRole("combobox")).toBeInTheDocument();
    });

    await userEvent.type(wrapper.getByRole("combobox"), "todo 1");

    await waitFor(() => {
      expect(mockGet).lastCalledWith("todo-api/todo", {
        filter: { name: { ILIKE: "%todo 1%" } },
        page: { limit: 10 },
        sort: "-createdOn"
      });
    });
  });

  it("Combines active scope filters and search filters together", async () => {
    const wrapper = mountWithContext(
      <ScopedResourceSelect
        {...DEFAULT_SELECT_PROPS}
        // 3. Updated to the new dictionary state
        defaultScopes={{ statusFilter: "active" }}
      />
    );

    await waitFor(() => {
      expect(wrapper.getByRole("combobox")).toBeInTheDocument();
    });

    await userEvent.type(wrapper.getByRole("combobox"), "todo 1");

    await waitFor(() => {
      expect(mockGet).lastCalledWith("todo-api/todo", {
        filter: {
          status: { EQ: "active" },
          name: { ILIKE: "%todo 1%" }
        },
        page: { limit: 10 },
        sort: "-createdOn"
      });
    });
  });

  it("Calls 'onChange' with the selected resource object in single mode", async () => {
    const mockOnChange = jest.fn();

    const wrapper = mountWithContext(
      <ScopedResourceSelect {...DEFAULT_SELECT_PROPS} onChange={mockOnChange} />
    );

    await userEvent.click(wrapper.getByText(/select item\.\.\./i));
    fireEvent.keyDown(wrapper.getByRole("combobox"), { key: "ArrowDown" });

    const options = wrapper.getAllByRole("option");
    await userEvent.click(options[1]); // "todo 2"

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(
        MOCK_TODOS.data[1],
        expect.objectContaining({ action: "select-option" })
      );
    });
  });

  it("Supports controlled multi-select mode and item removal", async () => {
    const mockOnChange = jest.fn();
    const selectedValues = [MOCK_TODOS.data[0], MOCK_TODOS.data[1]];

    const wrapper = mountWithContext(
      <ScopedResourceSelect<Todo>
        {...DEFAULT_SELECT_PROPS}
        isMulti={true}
        value={selectedValues}
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(wrapper.getByText("todo 1")).toBeInTheDocument();
      expect(wrapper.getByText("todo 2")).toBeInTheDocument();
    });

    // Remove first tag item
    const removeButtons = wrapper.getAllByRole("button", { name: /remove/i });
    if (removeButtons.length > 0) {
      await userEvent.click(removeButtons[0]);
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          [MOCK_TODOS.data[1]],
          expect.objectContaining({ action: "remove-value" })
        );
      });
    }
  });

  it("Supports additional custom filters, sort, include, and pageSize overrides", async () => {
    mountWithContext(
      <ScopedResourceSelect
        {...DEFAULT_SELECT_PROPS}
        include="group"
        sort="name"
        pageSize={25}
        additionalFilter={{ archived: { EQ: false } }}
      />
    );

    await waitFor(() => {
      expect(mockGet).lastCalledWith("todo-api/todo", {
        filter: { archived: { EQ: false } },
        include: "group",
        page: { limit: 25 },
        sort: "name"
      });
    });
  });

  it("Displays selected value label when controlled value is supplied", () => {
    const wrapper = mountWithContext(
      <ScopedResourceSelect<Todo>
        {...DEFAULT_SELECT_PROPS}
        value={MOCK_TODOS.data[2]}
      />
    );

    expect(wrapper.getByText("todo 3")).toBeInTheDocument();
  });
});
