import { PropsWithChildren, useEffect, useRef, useState } from "react";

export interface NativeScrollSpyNavProps {
  scrollTargetIds?: string[];
  /** Sub-section anchors, tracked and highlighted independently from scrollTargetIds. */
  subScrollTargetIds?: string[];
  activeNavClass?: string;
  offset?: number;
  scrollDuration?: string;
}

/**
 * Native implementation of scroll-spy navigation using Intersection Observer API.
 */
export function NativeScrollSpyNav({
  scrollTargetIds = [],
  subScrollTargetIds = [],
  activeNavClass = "active",
  offset = 0,
  children
}: PropsWithChildren<NativeScrollSpyNavProps>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const subObserverRef = useRef<IntersectionObserver | null>(null);

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
    // Clean up previous observer
    if (subObserverRef.current) {
      subObserverRef.current.disconnect();
    }

    const observerOptions: IntersectionObserverInit = {
      rootMargin: `${offset}px 0px -80% 0px`,
      threshold: 0
    };

    subObserverRef.current = new IntersectionObserver((entries) => {
      const intersectingEntry = entries.find((entry) => entry.isIntersecting);

      if (intersectingEntry) {
        setActiveSubId(intersectingEntry.target.id);
      }
    }, observerOptions);

    subScrollTargetIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element && subObserverRef.current) {
        subObserverRef.current.observe(element);
      }
    });

    return () => {
      if (subObserverRef.current) {
        subObserverRef.current.disconnect();
      }
    };
  }, [subScrollTargetIds, offset]);

  useEffect(() => {
    // Update active class on top-level nav items only.
    if (!activeId) return;

    document
      .querySelectorAll(`.list-group-item.${activeNavClass}`)
      .forEach((el) => {
        el.classList.remove(activeNavClass);
      });

    const activeLink = document.querySelector(`a[href="#${activeId}"]`);
    if (activeLink) {
      const listItem = activeLink.closest(".list-group-item");
      if (listItem) {
        listItem.classList.add(activeNavClass);
      }
    }
  }, [activeId, activeNavClass]);

  useEffect(() => {
    // Update active class on sub-nav links only, independently from the
    // top-level nav item's active state above.
    if (!activeSubId) return;

    document
      .querySelectorAll(`.sub-nav-list a.${activeNavClass}`)
      .forEach((el) => {
        el.classList.remove(activeNavClass);
      });

    const activeSubLink = document.querySelector(
      `.sub-nav-list a[href="#${activeSubId}"]`
    );
    if (activeSubLink) {
      activeSubLink.classList.add(activeNavClass);
    }
  }, [activeSubId, activeNavClass]);

  return <>{children}</>;
}
