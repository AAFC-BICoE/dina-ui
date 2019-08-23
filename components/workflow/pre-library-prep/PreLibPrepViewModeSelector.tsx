import { noop } from "lodash";

export type PreLibPrepViewMode =
  | "EDIT"
  | "SHEARING_DETAILS"
  | "SIZE_SELECTION_DETAILS";

interface ViewModeSelectorProps {
  viewMode: PreLibPrepViewMode;
  onChange: (newMode: PreLibPrepViewMode) => void;
}

/** View mode selector for the Pre Lib Prep page. */
export function PreLibPrepViewModeSelector({
  onChange,
  viewMode
}: ViewModeSelectorProps) {
  return (
    <ul className="list-inline">
      <li className="list-inline-item">
        <strong>View mode:</strong>
      </li>
      {[
        { label: "Edit", mode: "EDIT" },
        { label: "Shearing Details", mode: "SHEARING_DETAILS" },
        { label: "Size Selection Details", mode: "SIZE_SELECTION_DETAILS" }
      ].map(({ label, mode }) => (
        <li className="list-inline-item" key={mode}>
          <label>
            <input
              type="radio"
              checked={viewMode === mode}
              onChange={noop}
              onClick={() => onChange(mode as PreLibPrepViewMode)}
            />
            {label}
          </label>
        </li>
      ))}
    </ul>
  );
}
