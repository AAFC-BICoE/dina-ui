import { Children, ReactNode, useCallback, useEffect, useRef } from "react";

/**
 * Component that lets you split a page into independently scrollable sections.
 */
export function SplitPagePanel({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  
  document.documentElement.style.setProperty("height", "100%");
  document.documentElement.style.setProperty("margin", "0px");
  
  document.body.style.setProperty("height", "100%");
  document.body.style.setProperty("margin", "0px");

  let element1 = document.querySelector('#__next');
  element1?.setAttribute("style", "height:100%");

  // Memoized function that resizes the wrapper div on window resize:
  const resizeWrapper = useCallback(() => {
    const wrapper = ref.current;

    if (wrapper) {
      const height =
        window.innerHeight - wrapper.getBoundingClientRect().top - 1;
      wrapper.style.height = `${height}px`;
    }
  }, []);

// On first render, add the resize listener:
useEffect(() => {
  window.addEventListener("resize", resizeWrapper);
  return () => window.removeEventListener("resize", resizeWrapper);
}, []);

// After every render, resize the wrapper:
useEffect(() => {
  resizeWrapper();
});

  return (
    <div className="split-page-panel" ref={ref} style={{ overflowY: "scroll" }}>
      {children}
    </div>
  );
}
