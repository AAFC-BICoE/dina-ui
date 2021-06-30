import React from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { BrowseStorageTree } from "../storage/BrowseStorageTree";
export interface BrowseStorageTreeFieldProps {
  hasChildUnits?: boolean;
  className?: string;
  parentId?: string;
  hideResultMessage?: boolean;
  hideSearchSection?: boolean;
  hideSelectButton?: boolean;
}
export function BrowseStorageTreeField(props: BrowseStorageTreeFieldProps) {
  const {
    parentId,
    className,
    hasChildUnits,
    hideResultMessage,
    hideSearchSection,
    hideSelectButton
  } = props;
  return (
    <label className={"w-100 mb-3"}>
      <div className="mb-2">
        <strong>
          <DinaMessage id="childStorageUnit" />
        </strong>
      </div>
      <div style={{ borderStyle: "dotted" }}>
        {hasChildUnits && (
          <BrowseStorageTree
            className={`col-md-6 mb-2 ${className}`}
            hideResultMessage={hideResultMessage}
            hideSearchSection={hideSearchSection}
            hideSelectButton={hideSelectButton}
            parentId={parentId}
          />
        )}
      </div>
    </label>
  );
}
