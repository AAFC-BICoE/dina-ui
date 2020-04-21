import { useLocalStorage } from "@rehooks/local-storage";

type CollapserState = "COLLAPSED" | "OPEN";

/**
 * Collapse button to hide a UI. Store the collaped state in localstorage.
 */
export function useCollapser(id: string) {
  const STORAGE_KEY = `collapser-${id}-collapsed`;
  const [state, setState] = useLocalStorage<CollapserState>(STORAGE_KEY);
  const collapsed = state !== "OPEN";

  function Collapser() {
    return (
      <button
        className="collapser-button m-2 btn btn-secondary"
        onClick={() => setState(collapsed ? "OPEN" : "COLLAPSED")}
        type="button"
      >
        <i
          style={{
            border: "solid black",
            borderWidth: "0 3px 3px 0",
            display: "inline-block",
            padding: "5px",
            ...(collapsed
              ? {
                  WebkitTransform: "rotate(45deg)",
                  transform: "rotate(45deg)"
                }
              : {
                  WebkitTransform: "rotate(-135deg)",
                  transform: "rotate(-135deg)"
                })
          }}
        />
      </button>
    );
  }

  return { Collapser, collapsed };
}
