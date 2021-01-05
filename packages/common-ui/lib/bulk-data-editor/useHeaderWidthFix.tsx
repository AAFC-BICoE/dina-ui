import { GridSettings } from "handsontable";
import { useEffect, useRef } from "react";

interface HeaderWidthFixParams {
  columns: GridSettings[];
}

/** Fixes a bug with HandsOnTable where enabling the rowHeaders
 * (numbered cells on the left side of the grid) cuts off the right side of the
 * column headers.
 */
export function useHeaderWidthFix({ columns }: HeaderWidthFixParams) {
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // Whenever the columns change, run some code to manually set the width of the header row:
  useEffect(() => {
    setImmediate(() => {
      const wrapper = tableWrapperRef.current;

      if (wrapper) {
        const header = wrapper.querySelector<HTMLDivElement>(
          ".ht_clone_top .wtHider"
        );
        const htCore = wrapper.querySelector<HTMLDivElement>(
          ".ht_master .htCore"
        );

        if (header && htCore) {
          const requiredHeaderWidth = `${htCore.clientWidth}px`;
          header.style.width = requiredHeaderWidth;
        }
      }
    });
  }, [columns.map(col => col.data).join()]);

  return { tableWrapperRef };
}
