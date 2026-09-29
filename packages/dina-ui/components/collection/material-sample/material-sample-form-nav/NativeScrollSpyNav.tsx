import { PropsWithChildren, useEffect, useRef, useState } from "react";

export interface NativeScrollSpyNavProps {
  scrollTargetIds?: string[];
  /** Sub-section anchors, tracked and highlighted independently from scrollTargetIds. */
  subScrollTargetIds?: string[];
  activeNavClass?: string;
  scrollDuration?: string;
}

/**
 * Only watches the band of the viewport that starts at the targets' scroll-margin-top, so
 * the active item matches where click-to-scroll lands and ignores what the page header covers.
 */
function getObserverOptions(targetIds: string[]): IntersectionObserverInit {
  const firstTarget = targetIds
    .map((id) => document.getElementById(id))
    .find((element) => !!element);
  const topOffset = firstTarget
    ? parseFloat(getComputedStyle(firstTarget).scrollMarginTop) || 0
    : 0;
  const bandHeight = window.innerHeight * 0.2;
  const bottomOffset = Math.max(0, window.innerHeight - topOffset - bandHeight);

  return {
    rootMargin: `-${topOffset}px 0px -${bottomOffset}px 0px`,
    threshold: 0
  };
}

/** Scrolls the nav's own scroll container (not the page) so the active items stay visible. */
function scrollNavToActiveItems(activeNavClass: string) {
  const activeItem = document.querySelector<HTMLElement>(
    `.list-group-item.${activeNavClass}`
  );
  const container = activeItem?.closest<HTMLElement>(".material-sample-nav");
  if (!activeItem || !container) {
    return;
  }

  const activeSubLinks = Array.from(
    activeItem.nextElementSibling?.matches(".sub-nav-list")
      ? activeItem.nextElementSibling.querySelectorAll<HTMLElement>(
          `a.${activeNavClass}`
        )
      : []
  );

  // The active item is sticky at the top while its sub-links scroll beneath it.
  const topInset = activeSubLinks.length ? activeItem.offsetHeight : 0;
  const rects = (activeSubLinks.length ? activeSubLinks : [activeItem]).map(
    (element) => element.getBoundingClientRect()
  );
  const rangeTop = Math.min(...rects.map((rect) => rect.top));
  const rangeBottom = Math.max(...rects.map((rect) => rect.bottom));

  const containerRect = container.getBoundingClientRect();
  const visibleTop = containerRect.top + topInset;

  let delta = 0;
  if (rangeTop < visibleTop) {
    delta = rangeTop - visibleTop;
  } else if (rangeBottom > containerRect.bottom) {
    delta = Math.min(rangeBottom - containerRect.bottom, rangeTop - visibleTop);
  }

  if (delta !== 0) {
    container.scrollBy({ top: delta, behavior: "smooth" });
  }
}

/**
 * Native implementation of scroll-spy navigation using Intersection Observer API.
 */
export function NativeScrollSpyNav({
  scrollTargetIds = [],
  subScrollTargetIds = [],
  activeNavClass = "active",
  children
}: PropsWithChildren<NativeScrollSpyNavProps>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSubIds, setActiveSubIds] = useState<string[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const subObserverRef = useRef<IntersectionObserver | null>(null);
  const visibleSubIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create intersection observer
    const observerOptions = getObserverOptions(scrollTargetIds);

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
  }, [scrollTargetIds]);

  useEffect(() => {
    // Clean up previous observer
    if (subObserverRef.current) {
      subObserverRef.current.disconnect();
    }

    const observerOptions = getObserverOptions(subScrollTargetIds);

    visibleSubIdsRef.current = new Set();

    // Several sub-sections can be in view at once (e.g. side-by-side cards), so track them all.
    subObserverRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleSubIdsRef.current.add(entry.target.id);
        } else {
          visibleSubIdsRef.current.delete(entry.target.id);
        }
      });

      if (visibleSubIdsRef.current.size > 0) {
        setActiveSubIds([...visibleSubIdsRef.current]);
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
  }, [subScrollTargetIds]);

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
    if (activeSubIds.length === 0) return;

    document
      .querySelectorAll(`.sub-nav-list a.${activeNavClass}`)
      .forEach((el) => {
        el.classList.remove(activeNavClass);
      });

    activeSubIds.forEach((subId) => {
      document
        .querySelector(`.sub-nav-list a[href="#${subId}"]`)
        ?.classList.add(activeNavClass);
    });
  }, [activeSubIds, activeNavClass]);

  useEffect(() => {
    // Wait for the sub-list expand/collapse transition so the positions being measured are final.
    const timeout = window.setTimeout(
      () => scrollNavToActiveItems(activeNavClass),
      350
    );
    return () => window.clearTimeout(timeout);
  }, [activeId, activeSubIds, activeNavClass]);

  return <>{children}</>;
}
