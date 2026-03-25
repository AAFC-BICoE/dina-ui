import React from "react";
import Switch from "react-switch";

export function MapToggleSwitch({
  showMap,
  onToggle,
  formatMessage
}: {
  showMap: boolean;
  onToggle: (checked: boolean) => void;
  formatMessage: (key: string) => string;
}) {
  return (
    <div className="d-flex align-items-center gap-2 mb-2">
      <span className={showMap ? "opacity-100" : "opacity-50"}>
        <label htmlFor="mapToggler">
          <strong>{formatMessage("siteMap")}</strong>
        </label>
      </span>

      <Switch onChange={onToggle} checked={showMap} id="mapToggler" />

      <span className={showMap ? "opacity-50" : "opacity-100"}>
        <label htmlFor="mapToggler">
          <strong>{formatMessage("siteCoordinates")}</strong>
        </label>
      </span>
    </div>
  );
}
