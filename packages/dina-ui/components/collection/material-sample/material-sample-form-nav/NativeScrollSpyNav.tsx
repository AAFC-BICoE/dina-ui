import _ from "lodash";
import { PropsWithChildren, useEffect, useRef, useState } from "react";

export interface NativeScrollSpyNavProps {
  scrollTargetIds?: string[];
  /** Sub-section anchors, tracked and highlighted independently from scrollTargetIds. */
  subScrollTargetIds?: string[];
  activeNavClass?: string;
  scrollDuration?: string;
}

function getTopOffset(targetIds: string[]): number {
  const firstTarget = targetIds
    .map((id) => document.getElementById(id))
    .find((element) => !!element);
  return firstTarget
    ? parseFloat(getComputedStyle(firstTarget).scrollMarginTop) || 0
    : 0;
}

function isScrolledToPageBottom(): boolean {
  return (
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 2
  );
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
 * Scroll-spy navigation. Works out the active items from the targets' positions on every scroll
 * (rather than reacting to elements crossing a line), so it behaves the same scrolling up or down.
 */
export function NativeScrollSpyNav({
  scrollTargetIds = [],
  subScrollTargetIds = [],
  activeNavClass = "active",
  children
}: PropsWithChildren<NativeScrollSpyNavProps>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSubIds, setActiveSubIds] = useState<string[]>([]);
  /** The section the user clicked in the nav, kept active when the page can't scroll it into place. */
  const pinnedIdRef = useRef<string | null>(null);

  useEffect(() => {
    function pinClickedSection(event: MouseEvent) {
      const link = (
        event.target as HTMLElement | null
      )?.closest<HTMLAnchorElement>(".material-sample-nav a[href^='#']");
      const clickedId = link?.getAttribute("href")?.slice(1);
      if (clickedId && scrollTargetIds.includes(clickedId)) {
        pinnedIdRef.current = clickedId;
        setActiveId(clickedId);
      } else if (clickedId) {
        pinnedIdRef.current = null;
      }
    }
    function unpin() {
      pinnedIdRef.current = null;
    }

    document.addEventListener("click", pinClickedSection);
    window.addEventListener("wheel", unpin, { passive: true });
    window.addEventListener("touchmove", unpin, { passive: true });
    window.addEventListener("keydown", unpin);
    return () => {
      document.removeEventListener("click", pinClickedSection);
      window.removeEventListener("wheel", unpin);
      window.removeEventListener("touchmove", unpin);
      window.removeEventListener("keydown", unpin);
    };
  }, [scrollTargetIds]);

  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;

      // Starts where click-to-scroll lands (below the page header) and spans 20% of the viewport.
      const bandTop = getTopOffset(scrollTargetIds);
      const bandBottom = bandTop + window.innerHeight * 0.2;

      const targets = scrollTargetIds
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => !!element)
        .map((element) => ({
          id: element.id,
          top: element.getBoundingClientRect().top
        }));

      // The active section is the last one whose top has scrolled into or past the band.
      let nextActiveId = _.maxBy(
        targets.filter((target) => target.top <= bandBottom),
        (target) => target.top
      )?.id;

      // Sub-sections: everything overlapping the band, since several can be in view at once.
      let nextSubIds = subScrollTargetIds.filter((id) => {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        return !!rect && rect.bottom > bandTop && rect.top < bandBottom;
      });

      // The page can't scroll far enough for the last targets to reach the band,
      // so at the bottom, use whatever is showing there instead.
      if (isScrolledToPageBottom()) {
        const pinnedTop = targets.find(
          (target) => target.id === pinnedIdRef.current
        )?.top;
        const lastTarget = _.maxBy(
          targets.filter((target) => target.top < window.innerHeight),
          (target) => target.top
        );
        nextActiveId =
          pinnedTop !== undefined && pinnedTop < window.innerHeight
            ? pinnedIdRef.current ?? undefined
            : lastTarget?.id;

        nextSubIds = subScrollTargetIds.filter((id) => {
          const rect = document.getElementById(id)?.getBoundingClientRect();
          return (
            !!rect && rect.bottom > bandTop && rect.top < window.innerHeight
          );
        });
      }

      if (nextActiveId) {
        setActiveId(nextActiveId);
      }
      if (nextSubIds.length > 0) {
        setActiveSubIds((previous) =>
          previous.join() === nextSubIds.join() ? previous : nextSubIds
        );
      }
    }

    function scheduleUpdate() {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [scrollTargetIds, subScrollTargetIds]);

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
