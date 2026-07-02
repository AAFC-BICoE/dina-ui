import { PropsWithChildren, useEffect, useRef, useState } from "react";

export interface NativeScrollSpyNavProps {
  scrollTargetIds?: string[];
  activeNavClass?: string;
  offset?: number;
  scrollDuration?: string;
}

/**
 * Native implementation of scroll-spy navigation using Intersection Observer API.
 */
export function NativeScrollSpyNav({
  scrollTargetIds = [],
  activeNavClass = "active",
  offset = 0,
  children
}: PropsWithChildren<NativeScrollSpyNavProps>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create intersection observer
    const observerOptions: IntersectionObserverInit = {
      rootMargin: `${offset}px 0px -80% 0px`,
      threshold: 0
    };

    observerRef.current = new IntersectionObserver((entries) => {
      // Find the first intersecting entry
      const intersectingEntry = entries.find((entry) => entry.isIntersecting);

      if (intersectingEntry) {
        setActiveId(intersectingEntry.target.id);
      }
    }, observerOptions);

    // Observe all target elements
    scrollTargetIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [scrollTargetIds, offset]);

  useEffect(() => {
    // Update active class on nav items
    if (!activeId) return;

    // Remove active class from all nav links
    document.querySelectorAll(`.${activeNavClass}`).forEach((el) => {
      el.classList.remove(activeNavClass);
    });

    // Add active class to the current nav link
    const activeLink = document.querySelector(`a[href="#${activeId}"]`);
    if (activeLink) {
      const listItem = activeLink.closest(".list-group-item");
      if (listItem) {
        listItem.classList.add(activeNavClass);
      }
    }
  }, [activeId, activeNavClass]);

  return <>{children}</>;
}
