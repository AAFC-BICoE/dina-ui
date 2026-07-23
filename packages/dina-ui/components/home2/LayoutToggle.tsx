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
 * placed beside the global search bar. Uses Bootstrap Button components
 * wrapped in the same card+pill visual style as the
 * TransactionMaterialDirectionSection. When the new layout is active and
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
      {/* Layout pill toggle — card+pill wrapper around Bootstrap ButtonGroup */}
      <div className="d-flex align-items-center gap-1">
        <span className="text-muted small text-nowrap me-1">Layout:</span>
        <div className="card pill">
          <ButtonGroup size="sm">
            <Button
              onClick={useNewLayout ? switchToClassic : undefined}
              variant={useNewLayout ? "link" : "dark"}
              className={
                "rounded-pill px-2 text-nowrap " +
                (useNewLayout ? "text-muted" : "fw-bold")
              }
            >
              <FaGripLines
                style={{ fontSize: "0.75rem", marginRight: "0.2rem" }}
              />
              Classic
            </Button>
            <Button
              onClick={!useNewLayout ? switchToNew : undefined}
              variant={useNewLayout ? "dark" : "link"}
              className={
                "rounded-pill px-2 text-nowrap " +
                (useNewLayout ? "fw-bold" : "text-muted")
              }
            >
              <FaGrip style={{ fontSize: "0.75rem", marginRight: "0.2rem" }} />
              New
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {/* Customize gear — card+pill wrapper around Bootstrap Button */}
      {useNewLayout && setIsCustomizeMode && (
        <div className="card pill">
          <Button
            variant={isCustomizeMode ? "dark" : "link"}
            size="sm"
            onClick={() => setIsCustomizeMode((prev) => !prev)}
            className={
              "rounded-pill px-2 text-nowrap d-inline-flex align-items-center gap-1 " +
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
        </div>
      )}
    </div>
  );
}
