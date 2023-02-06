import { GridSettings } from "handsontable";
import { useCallback, useEffect, useMemo, useRef } from "react";

interface HeaderWidthFixParams {
  columns: GridSettings[];
}

/** Fixes a bug with HandsOnTable where enabling the rowHeaders
 * (numbered cells on the left side of the grid) cuts off the right side of the
 * column headers.
 */
export function useHeaderWidthFix({ columns }: HeaderWidthFixParams) {
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  /** Manually sets the width of the header row to the correct value. */
  const fixWidth = useCallback(() => {
    setImmediate(() => {
      const wrapper = tableWrapperRef.current;

      const makeHotTableContenHolderFocusable = () => {
        // Fix Ensure that scrollable region has keyboard access (making the scrollable region focusable)
        const htHolder = wrapper?.querySelector<HTMLDivElement>(
          ".ht_master .wtHolder"
        );
        if (htHolder) {
          htHolder.style.overflowY = "auto";
          htHolder.tabIndex = 0;
        }
        // Fix text area within hot table sometimes has the "Ensure scrollable region has keyboard access" issue
        const textArea = wrapper?.querySelector<HTMLDivElement>(
          ".handsontableInputHolder .handsontableInput"
        );
        if (textArea) {
          textArea.style.height = "auto";
          textArea.tabIndex = 0;
        }
      };
      if (wrapper) {
        const header = wrapper.querySelector<HTMLDivElement>(
          ".ht_clone_top .wtHider"
        );
        const htCore =
          wrapper.querySelector<HTMLDivElement>(".ht_master .htCore");

        if (header && htCore) {
          const requiredHeaderWidth = `${htCore.clientWidth}px`;
          header.style.width = requiredHeaderWidth;
        }

        makeHotTableContenHolderFocusable();
      }
    });
  }, []);

  // Whenever the columns change, run some code to manually set the width of the header row:
  useEffect(fixWidth, [columns.map((col) => col.data).join()]);

  // Sometimes the Handsontable resizes itself wrong when clicking on a cell. Run the code again on every mouse click:
  useEffect(() => {
    document.addEventListener("click", fixWidth);
    document.addEventListener("resize", fixWidth);
    return () => {
      document.removeEventListener("click", fixWidth);
      document.removeEventListener("resize", fixWidth);
    };
  }, []);

  return { tableWrapperRef };
}
