import { useLocalStorage } from "@rehooks/local-storage";
import React, { useCallback } from "react";
import { FaAngleDown } from "react-icons/fa6";

type CollapserState = "COLLAPSED" | "OPEN";

interface UseCollapserReturn {
  Collapser: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>; // Allow passing button props
  collapsed: boolean;
  toggle: () => void; // Expose toggle function
  setState: (state: CollapserState) => void; // Expose setState
}

/**
 * Provides state and a button component to toggle a collapsible UI section.
 * Stores the collapsed state in local storage.
 *
 * @param id - A unique identifier for the local storage key.
 * @param defaultState - The initial state if nothing is found in local storage ('OPEN' or 'COLLAPSED'). Defaults to 'OPEN'.
 */
export function useCollapser(
  id: string,
  defaultState: CollapserState = "OPEN"
): UseCollapserReturn {
  const STORAGE_KEY = `collapser-${id}`; // Simplified key name

  // Provide the default state directly to useLocalStorage
  const [state, setState] = useLocalStorage<CollapserState>(
    STORAGE_KEY,
    defaultState
  );

  // Ensure state is valid, default to defaultState if localStorage somehow gets corrupted
  const currentState =
    state === "COLLAPSED" || state === "OPEN" ? state : defaultState;
  const collapsed = currentState === "COLLAPSED";

  const toggle = useCallback(() => {
    setState(collapsed ? "OPEN" : "COLLAPSED");
  }, [collapsed, setState]);

  const Collapser = useCallback(
    ({
      className,
      ...restProps
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
      const buttonLabel = collapsed ? "Expand section" : "Collapse section";

      return (
        <button
          className={`collapser-button btn btn-light ${className || ""}`}
          onClick={toggle}
          type="button"
          aria-expanded={!collapsed}
          aria-label={buttonLabel}
          title={buttonLabel}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.5rem",
            height: "2.5rem",
            marginTop: "-5px",
            marginLeft: "10px",
            background: "transparent",
            border: "none"
          }}
          {...restProps}
        >
          <FaAngleDown
            style={{
              fontSize: "1.5rem",
              color: "#000",
              transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 2s cubic-bezier(.4,2,.55,.44)",
              willChange: "transform"
            }}
          />
        </button>
      );
    },
    [toggle, collapsed]
  );

  return { Collapser, collapsed, toggle, setState };
}
