import { RefObject, useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";
import { Tooltip } from "common-ui";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";
import { GroupLabel } from "../../group-select/GroupFieldView";
import styles from "./MaterialSampleForm.module.css";

export interface MaterialSampleCompactHeaderProps {
  materialSample: MaterialSample;
  scientificName?: string;
  /** The full header component, the compact bar slides in once the full header scrolls out of view. */
  headerRef: RefObject<HTMLElement | null>;
}

/**
 * One-line name bar that sticks under the button bar once the full view header scrolls away.
 * Its sticky wrapper has zero height, so showing the bar never shifts the page content.
 */
export function MaterialSampleCompactHeader({
  materialSample,
  scientificName,
  headerRef
}: MaterialSampleCompactHeaderProps) {
  const { formatMessage } = useDinaIntl();
  const notReleasable = formatMessage("notPubliclyReleasable");

  // Height of the sticky button bar; stays undefined when there is none (e.g. in tests), so no compact bar.
  const [buttonBarHeight, setButtonBarHeight] = useState<number>();
  const [scrolledPast, setScrolledPast] = useState(false);

  // Effect to track the height of the sticky button bar and whether the full header has scrolled past it.
  useEffect(() => {
    const buttonBar = document.querySelector<HTMLElement>(".button-bar-sticky");
    const header = headerRef.current;
    if (!buttonBar || !header) return;

    function update() {
      const height = buttonBar!.offsetHeight;
      setButtonBarHeight(height);
      setScrolledPast(header!.getBoundingClientRect().bottom < height);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (buttonBarHeight === undefined) {
    return null;
  }

  return (
    <div
      className={styles.compactHeaderAnchor}
      style={{ top: buttonBarHeight }}
    >
      <div
        className={`${styles.compactHeader} ${
          scrolledPast ? "" : styles.compactHeaderHidden
        } bg-white border-bottom py-2 d-flex align-items-baseline gap-2 ${
          materialSample.isRestricted ? "border-danger" : ""
        }`}
      >
        <span className={`${styles.compactText} fw-bold fs-5 text-truncate`}>
          {materialSample.materialSampleName ?? materialSample.id}
        </span>
        {scientificName && (
          <span className={`${styles.compactText} text-muted text-truncate`}>
            {scientificName}
          </span>
        )}
        <span className="ms-auto text-nowrap">
          {!materialSample.publiclyReleasable && (
            <Tooltip
              disableSpanMargin={true}
              className="me-2"
              placement="bottom"
              directText={
                materialSample.notPubliclyReleasableReason || notReleasable
              }
              visibleElement={<FaLock aria-label={notReleasable} />}
            />
          )}
          <GroupLabel
            groupName={materialSample.group}
            defaultLinkColor={true}
          />
        </span>
      </div>
    </div>
  );
}
