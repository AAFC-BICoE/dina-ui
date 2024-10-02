import { RefObject, useEffect, useState } from "react";

export interface UseIsVisibleProps {
  /**
   * useRef hook, should be attached to a div that's always rendered on the page.
   */
  ref: RefObject<any>;

  /**
   * Determines if it should be reset back to false when it's out of view.
   */
  doNotReset?: boolean;

  /**
   * offset for the viewport, for example: '0px 0px 200px 0px' if you want to consider 200px under
   * the view port as visible.
   */
  offset?: string;
}

/**
 * Hook used to determine if a reference is being displayed currently to the user.
 *
 * If it's not within the users view port, it's returned as false.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
 * @returns boolean if it's currently being displayed on the screen.
 */
export function useIsVisible({
  ref,
  doNotReset = false,
  offset
}: UseIsVisibleProps) {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        if (doNotReset && inView === false) {
          return;
        }

        setIntersecting(inView);
      },
      { rootMargin: offset }
    );

    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return isIntersecting;
}
