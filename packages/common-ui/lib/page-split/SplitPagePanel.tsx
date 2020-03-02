import { HTMLAttributes, useCallback, useEffect, useRef } from "react";

/**
 * Component that lets you split a page into independently scrollable sections.
 */
export function SplitPagePanel(props: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  // Memoized function that resizes the wrapper div on window resize:
  const resizeWrapper = useCallback(() => {
    const wrapper = ref.current;

    if (wrapper) {
      const height =
        window.innerHeight - wrapper.getBoundingClientRect().top - 1;
      wrapper.style.height = `${height - 100}px`;
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
    <div
      className="split-page-panel"
      {...props}
      ref={ref}
      style={{ overflowY: "scroll" }}
    >
      {props.children}
    </div>
  );
}
