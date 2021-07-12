import React from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageTreeList } from "../storage/BrowseStorageTree";
export interface StorageTreeFieldProps {
  className?: string;
  parentId?: string;
  disabled?: boolean;
}
export function StorageTreeListField(props: StorageTreeFieldProps) {
  const { parentId, className, disabled } = props;

  return (
    <label className={"w-100 mb-3"}>
      <div className="mb-2">
        <strong>
          <DinaMessage id="childStorageUnit" />
        </strong>
      </div>
      <div style={{ borderStyle: "dotted" }}>
        <StorageTreeList
          className={`col-md-6 mb-2 ${className}`}
          parentId={parentId}
          disabled={disabled}
        />
      </div>
    </label>
  );
}
