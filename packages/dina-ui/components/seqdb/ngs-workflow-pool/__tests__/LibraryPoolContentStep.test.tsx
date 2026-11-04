import { mountWithAppContext } from "common-ui";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import _ from "lodash";
import { useState } from "react";
import { LibraryPoolContentStep } from "../LibraryPoolContentStep";
import { LibraryPool } from "../../../../types/seqdb-api";

const LIBRARY_POOL: LibraryPool = {
  id: "pool-1",
  type: "library-pool",
  name: "Pool 1"
};

// Hide used hides the used batch and pool.
const mockGet = jest.fn<any, any>(async (path: string, params?: any) => {
  const hideUsed = !!params?.filter?.dateUsed;
  switch (path) {
    case "seqdb-api/library-prep-batch":
      return {
        data: [
          { id: "batch-1", type: "library-prep-batch", name: "Batch 1" },
          ...(hideUsed
            ? []
            : [
                {
                  id: "batch-2",
                  type: "library-prep-batch",
                  name: "Batch 2",
                  dateUsed: "2026-01-15"
                }
              ])
        ],
        meta: { totalResourceCount: hideUsed ? 1 : 2 }
      };
    case "seqdb-api/library-pool":
      return {
        data: [
          { id: "pool-2", type: "library-pool", name: "Pool 2" },
          ...(hideUsed
            ? []
            : [
                {
                  id: "pool-3",
                  type: "library-pool",
                  name: "Pool 3",
                  dateUsed: "2026-01-15"
                }
              ])
        ],
        meta: { totalResourceCount: hideUsed ? 1 : 2 }
      };
    case "/seqdb-api/library-pool-content":
      return mockSavedContents(params?.include);
  }
  return { data: [] };
});

/** The pool's saved contents, as the app's API client returns them (none unless a test sets some). */
let mockSavedContents: (include?: string) => any = () => ({ data: [] });

const mockSave = jest.fn<any, any>(async (operations: any[]) =>
  operations.map(({ resource }) => resource)
);

const mockBulkDelete = jest.fn<any, any>(async () => undefined);

const testCtx = {
  apiContext: {
    apiClient: { get: mockGet },
    save: mockSave,
    bulkDeleteResources: mockBulkDelete
  }
};

/** The params of the last request to a path (the step also loads its pool contents). */
function lastParams(path: string) {
  const calls = mockGet.mock.calls.filter(([callPath]) => callPath === path);
  return calls[calls.length - 1]?.[1];
}

/** The Type and Name of each row of the Selected Pool Contents table (the cells after its checkbox). */
function poolContentRows(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll(".library-pool-content-table tbody tr"),
    (row) =>
      Array.from(row.querySelectorAll("td + td"), (cell) => cell.textContent)
  );
}

/** Holds performSave as the run page does, with a button for its Save button. */
function TestComponent() {
  const [performSave, setPerformSave] = useState(false);
  return (
    <>
      <button onClick={() => setPerformSave(true)}>Save</button>
      <LibraryPoolContentStep
        libraryPoolId="pool-1"
        libraryPool={LIBRARY_POOL}
        onSaved={jest.fn()}
        editMode={true}
        setEditMode={_.noop}
        performSave={performSave}
        setPerformSave={setPerformSave}
      />
    </>
  );
}

function mountStep() {
  return mountWithAppContext(<TestComponent />, testCtx);
}

describe("LibraryPoolContentStep component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("Sends Hide used, which is ticked by default, as a simple filter.", async () => {
    const wrapper = mountStep();

    await waitFor(() =>
      expect(wrapper.getByText("Batch 1")).toBeInTheDocument()
    );
    expect(lastParams("seqdb-api/library-prep-batch")).toEqual({
      filter: { dateUsed: { EQ: null } },
      page: { limit: 25, offset: 0 }
    });
  });

  it("Sends no Hide used filter when Hide used is unticked.", async () => {
    const wrapper = mountStep();
    await waitFor(() =>
      expect(wrapper.getByText("Batch 1")).toBeInTheDocument()
    );

    await userEvent.click(
      wrapper.container.querySelector(".hide-used-checkbox")!
    );

    await waitFor(() =>
      expect(lastParams("seqdb-api/library-prep-batch")).toEqual({
        filter: {},
        page: { limit: 25, offset: 0 }
      })
    );
  });

  it("Loads the other library pools with a simple filter.", async () => {
    const wrapper = mountStep();
    await waitFor(() =>
      expect(wrapper.getByText("Batch 1")).toBeInTheDocument()
    );

    await userEvent.click(wrapper.getByText("Library Pools"));

    await waitFor(() =>
      expect(wrapper.getByText("Pool 2")).toBeInTheDocument()
    );
    expect(lastParams("seqdb-api/library-pool")).toEqual({
      filter: { uuid: { NEQ: "pool-1" }, dateUsed: { EQ: null } },
      page: { limit: 25, offset: 0 }
    });
  });

  it("Adds and saves a batch ticked before it was hidden.", async () => {
    const wrapper = mountStep();
    const hideUsed = () =>
      wrapper.container.querySelector(".hide-used-checkbox")!;
    await waitFor(() =>
      expect(wrapper.getByText("Batch 1")).toBeInTheDocument()
    );

    // Untick Hide used to list the used batch, and tick it.
    await userEvent.click(hideUsed());
    await userEvent.click(await wrapper.findByTestId("checkbox-batch-2"));

    // Tick Hide used again: the batch is no longer listed but stays ticked.
    await userEvent.click(hideUsed());
    await waitFor(() =>
      expect(wrapper.queryByText("Batch 2")).not.toBeInTheDocument()
    );

    await userEvent.click(
      wrapper.container.querySelector(".select-all-checked-button button")!
    );
    expect(poolContentRows(wrapper.container)).toEqual([
      ["Library", "Batch 2"]
    ]);

    await userEvent.click(wrapper.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mockSave).toHaveBeenCalledWith(
        [
          {
            resource: expect.objectContaining({
              relationships: {
                libraryPool: { data: { id: "pool-1", type: "library-pool" } },
                pooledLibraryPrepBatch: {
                  data: { id: "batch-2", type: "library-prep-batch" }
                }
              }
            }),
            type: "library-pool-content"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      )
    );
  });

  it("Adds a library pool ticked before it was hidden.", async () => {
    const wrapper = mountStep();
    const hideUsed = () =>
      wrapper.container.querySelector(".hide-used-checkbox")!;
    await userEvent.click(wrapper.getByText("Library Pools"));
    await waitFor(() =>
      expect(wrapper.getByText("Pool 2")).toBeInTheDocument()
    );

    await userEvent.click(hideUsed());
    await userEvent.click(await wrapper.findByTestId("checkbox-pool-3"));
    await userEvent.click(hideUsed());
    await waitFor(() =>
      expect(wrapper.queryByText("Pool 3")).not.toBeInTheDocument()
    );

    await userEvent.click(
      wrapper.container.querySelector(".select-all-checked-button button")!
    );
    expect(poolContentRows(wrapper.container)).toEqual([
      ["Library Pool", "Pool 3"]
    ]);
  });
});

/** Returns mock saved pool contents, populating related entities only when included. */
function savedContents(include?: string) {
  const included = (include ?? "").split(",");
  const withIncludes = [
    "libraryPool",
    "pooledLibraryPrepBatch",
    "pooledLibraryPool"
  ].every((name) => included.includes(name));
  const content = (id: string, pooled: any) => ({
    id,
    type: "library-pool-content",
    createdBy: "dina-su",
    libraryPool: withIncludes ? { ...LIBRARY_POOL } : null,
    pooledLibraryPrepBatch:
      withIncludes && pooled.type === "library-prep-batch" ? pooled : null,
    pooledLibraryPool:
      withIncludes && pooled.type === "library-pool" ? pooled : null
  });
  return {
    data: [
      content("content-1", {
        id: "batch-1",
        type: "library-prep-batch",
        name: "Batch 1"
      }),
      content("content-2", {
        id: "pool-2",
        type: "library-pool",
        name: "Pool 2"
      })
    ],
    meta: { totalResourceCount: 2 }
  };
}

const mockSetEditMode = jest.fn();

/** The step on Pool 1, which has saved contents. */
function SavedPoolTestComponent({ editMode }: { editMode: boolean }) {
  const [performSave, setPerformSave] = useState(false);
  return (
    <>
      <button onClick={() => setPerformSave(true)}>Save</button>
      <LibraryPoolContentStep
        libraryPoolId="pool-1"
        libraryPool={LIBRARY_POOL}
        onSaved={jest.fn()}
        editMode={editMode}
        setEditMode={mockSetEditMode}
        performSave={performSave}
        setPerformSave={setPerformSave}
      />
    </>
  );
}

/** Every cell of every row of the Selected Pool Contents table. */
function allContentCells(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll(".library-pool-content-table tbody tr"),
    (row) => Array.from(row.querySelectorAll("td"), (cell) => cell.textContent)
  );
}

describe("LibraryPoolContentStep component, pool with saved contents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockSavedContents = savedContents;
  });

  afterEach(() => {
    mockSavedContents = () => ({ data: [] });
  });

  it("Shows the type and name of the saved contents.", async () => {
    const wrapper = mountWithAppContext(
      <SavedPoolTestComponent editMode={false} />,
      testCtx
    );
    await waitFor(() =>
      expect(allContentCells(wrapper.container)).toEqual([
        ["Library", "Batch 1"],
        ["Library Pool", "Pool 2"]
      ])
    );
  });

  it("Saves a batch added to a pool with saved contents.", async () => {
    const wrapper = mountWithAppContext(
      <SavedPoolTestComponent editMode={true} />,
      testCtx
    );
    await waitFor(() =>
      expect(poolContentRows(wrapper.container)).toHaveLength(2)
    );

    await userEvent.click(
      wrapper.container.querySelector(".hide-used-checkbox")!
    );
    await userEvent.click(await wrapper.findByTestId("checkbox-batch-2"));
    await userEvent.click(
      wrapper.container.querySelector(".select-all-checked-button button")!
    );
    await userEvent.click(wrapper.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mockSetEditMode).toHaveBeenCalledWith(false));
    expect(mockSave).toHaveBeenCalledWith(
      expect.arrayContaining([
        {
          resource: expect.objectContaining({
            relationships: {
              libraryPool: { data: { id: "pool-1", type: "library-pool" } },
              pooledLibraryPrepBatch: {
                data: { id: "batch-2", type: "library-prep-batch" }
              }
            }
          }),
          type: "library-pool-content"
        }
      ]),
      { apiBaseUrl: "/seqdb-api" }
    );
  });

  it("Deletes a saved content removed from a pool with other saved contents.", async () => {
    const wrapper = mountWithAppContext(
      <SavedPoolTestComponent editMode={true} />,
      testCtx
    );
    await waitFor(() =>
      expect(poolContentRows(wrapper.container)).toHaveLength(2)
    );

    await userEvent.click(await wrapper.findByTestId("checkbox-content-1"));
    await userEvent.click(
      wrapper.container.querySelector(".deselect-all-checked-button button")!
    );
    await userEvent.click(wrapper.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mockSetEditMode).toHaveBeenCalledWith(false));
    expect(mockBulkDelete).toHaveBeenCalledWith(["content-1"], {
      apiBaseUrl: "/seqdb-api",
      resourceType: "library-pool-content"
    });
  });

  it("Doesn't add a batch that is already in the pool.", async () => {
    const wrapper = mountWithAppContext(
      <SavedPoolTestComponent editMode={true} />,
      testCtx
    );
    await waitFor(() =>
      expect(poolContentRows(wrapper.container)).toHaveLength(2)
    );

    await userEvent.click(
      wrapper.container.querySelector(".hide-used-checkbox")!
    );
    await userEvent.click(await wrapper.findByTestId("checkbox-batch-1"));
    await userEvent.click(
      wrapper.container.querySelector(".select-all-checked-button button")!
    );

    expect(poolContentRows(wrapper.container)).toEqual([
      ["Library", "Batch 1"],
      ["Library Pool", "Pool 2"]
    ]);
  });
});
