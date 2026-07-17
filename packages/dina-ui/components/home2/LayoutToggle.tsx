import { FaGear, FaGrip, FaGripLines } from "react-icons/fa6";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { useRouter } from "next/router";

export interface LayoutToggleProps {
  useNewLayout: boolean;
  activateNewLayout: () => void | Promise<void>;
  deactivateNewLayout: () => void | Promise<void>;
  isCustomizeMode?: boolean;
  setIsCustomizeMode?: (value: React.SetStateAction<boolean>) => void;
}

/**
 * Pill-style toggle for switching between the classic and new home layouts,
 * placed beside the global search bar. When the new layout is active and
 * customize props are provided, a gear icon appears to enter customize mode.
 *
 * Layout props are passed in from the parent page so that the toggle shares
 * a single UIPreferenceHook instance with the rest of the page, avoiding
 * stale-data overwrites when switching layouts.
 */
export function LayoutToggle({
  useNewLayout,
  activateNewLayout,
  deactivateNewLayout,
  isCustomizeMode,
  setIsCustomizeMode
}: LayoutToggleProps) {
  const router = useRouter();

  const switchToClassic = async () => {
    await deactivateNewLayout();
    router.push("/");
  };

  const switchToNew = async () => {
    await activateNewLayout();
    router.push("/feedback/home2");
  };

  return (
    <div className="d-flex align-items-center gap-3">
      {/* Layout pill toggle */}
      <div className="d-flex align-items-center gap-1">
        <span className="text-muted small text-nowrap me-1">Layout:</span>
        <ButtonGroup size="sm">
          <Button
            onClick={useNewLayout ? switchToClassic : undefined}
            variant={useNewLayout ? "outline-dark" : "link"}
            className={
              "text-nowrap text-decoration-none px-2 " +
              (useNewLayout ? "fw-bold" : "text-muted")
            }
          >
            <FaGripLines
              style={{ fontSize: "0.8rem", margin: "0 0.25rem 0 0" }}
            />
            Classic
          </Button>
          <Button
            onClick={!useNewLayout ? switchToNew : undefined}
            variant={useNewLayout ? "link" : "outline-dark"}
            className={
              "text-nowrap text-decoration-none px-2 d-inline-flex align-items-center gap-1 " +
              (useNewLayout ? "text-muted" : "fw-bold")
            }
          >
            <FaGrip style={{ fontSize: "0.8rem" }} />
            New
          </Button>
        </ButtonGroup>
      </div>

      {/* Customize gear */}
      {useNewLayout && setIsCustomizeMode && (
        <Button
          variant={isCustomizeMode ? "outline-dark" : "link"}
          size="sm"
          onClick={() => setIsCustomizeMode((prev) => !prev)}
          className={
            "text-nowrap text-decoration-none d-inline-flex align-items-center gap-1 " +
            (isCustomizeMode ? "fw-bold" : "text-muted")
          }
          title={isCustomizeMode ? "Done customizing" : "Customize"}
        >
          <FaGear
            className={isCustomizeMode ? "fa-spin" : undefined}
            style={{ fontSize: "0.85rem" }}
          />
          {isCustomizeMode ? "Done" : "Customize"}
        </Button>
      )}
    </div>
  );
}
