import { act, renderHook, waitFor } from "@testing-library/react";
import { MockAppContextProvider } from "common-ui";
import { ReactNode } from "react";
import { useChangeOrder } from "../useChangeOrder";

const ITEMS = ["a", "b", "c"].map((id, index) => ({
  id,
  type: "controlled-vocabulary-item",
  name: id.toUpperCase(),
  position: index + 1
}));

const mockGet = jest.fn(async () => ({ data: ITEMS }));
const mockSave = jest.fn();
const onSaved = jest.fn();

async function renderChangeOrder() {
  const hook = renderHook(
    () =>
      useChangeOrder({
        vocabularyId: "vocab-1",
        apiBaseUrl: "/collection-api",
        onSaved
      }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MockAppContextProvider
          apiContext={{ apiClient: { get: mockGet }, save: mockSave } as any}
        >
          {children}
        </MockAppContextProvider>
      )
    }
  );
  await waitFor(() => expect(hook.result.current.items).toHaveLength(3));
  return hook;
}

const ids = (items: { id: string }[]) => items.map((item) => item.id);

describe("useChangeOrder", () => {
  beforeEach(jest.clearAllMocks);

  it("Moves the dragged item onto the item it's dropped over.", async () => {
    const { result } = await renderChangeOrder();

    act(() => result.current.onDragStart({ active: { id: "c" } } as any));
    expect(result.current.draggingId).toEqual("c");
    expect(result.current.activeId).toEqual("c");

    act(() =>
      result.current.onDragEnd({
        active: { id: "c" },
        over: { id: "a" }
      } as any)
    );
    expect(ids(result.current.items)).toEqual(["c", "a", "b"]);
    expect(result.current.draggingId).toBeUndefined();
    // The dropped item stays highlighted.
    expect(result.current.activeId).toEqual("c");
  });

  it("Keeps the order when an item is dropped on itself or outside the list.", async () => {
    const { result } = await renderChangeOrder();

    act(() => result.current.onDragStart({ active: { id: "a" } } as any));
    act(() =>
      result.current.onDragEnd({
        active: { id: "a" },
        over: { id: "a" }
      } as any)
    );
    act(() =>
      result.current.onDragEnd({ active: { id: "a" }, over: null } as any)
    );
    expect(ids(result.current.items)).toEqual(["a", "b", "c"]);
  });

  it("Clears the dragged item when the drag is cancelled.", async () => {
    const { result } = await renderChangeOrder();

    act(() => result.current.onDragStart({ active: { id: "b" } } as any));
    act(() => result.current.onDragCancel());
    expect(result.current.draggingId).toBeUndefined();
    expect(ids(result.current.items)).toEqual(["a", "b", "c"]);
  });

  it("Ignores moves past either end of the list.", async () => {
    const { result } = await renderChangeOrder();

    act(() => result.current.moveItem(0, -1));
    act(() => result.current.moveItem(2, 3));
    expect(ids(result.current.items)).toEqual(["a", "b", "c"]);
    expect(result.current.activeId).toBeUndefined();
  });

  it("Skips the request when no position changed.", async () => {
    const { result } = await renderChangeOrder();

    await act(() => result.current.saveOrder());
    expect(mockSave).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
  });

  it("Shows the error and stays open when saving fails.", async () => {
    mockSave.mockRejectedValueOnce(new Error("Position already used"));
    const { result } = await renderChangeOrder();

    act(() => result.current.moveItem(0, 1));
    await act(() => result.current.saveOrder());
    expect(result.current.error).toEqual("Position already used");
    expect(result.current.saving).toEqual(false);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("Explains a position another save took first.", async () => {
    mockSave.mockRejectedValueOnce(
      new Error(
        'Bad Request: ERROR: duplicate key value violates unique constraint "unique_position_per_controlled_vocabulary"'
      )
    );
    const { result } = await renderChangeOrder();

    act(() => result.current.moveItem(0, 1));
    await act(() => result.current.saveOrder());

    expect(result.current.error).toEqual(
      "Someone else changed the order at the same time. Close and reopen Change Order to see the latest order."
    );
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("Explains a refused save instead of showing the request URL.", async () => {
    mockSave.mockRejectedValueOnce(
      Object.assign(
        new Error("/collection-api/controlled-vocabulary-item/bulk:"),
        {
          cause: { status: 403 }
        }
      )
    );
    const { result } = await renderChangeOrder();

    act(() => result.current.moveItem(0, 1));
    await act(() => result.current.saveOrder());

    expect(result.current.error).toEqual(
      "You don't have permission to change some of these items, so the order wasn't saved."
    );
    // Nothing was saved, so the user's order stays for them to adjust.
    expect(ids(result.current.items)).toEqual(["b", "a", "c"]);
  });
});
