import React from "react";
import { Tooltip } from "../tooltip/Tooltip";
import { useIntl } from "react-intl";

export interface BulkEditBadgeProps {
  bulkTab: any;
  className?: string;
}

export function BulkEditBadge({ bulkTab, className }: BulkEditBadgeProps) {
  const { formatMessage } = useIntl();

  // Do not display the badge if not in a bulk edit context.
  if (!bulkTab) {
    return <></>;
  }

  // Show Cleared badge if explicitly cleared
  if (bulkTab.isExplicitlyCleared) {
    return (
      <Tooltip
        directText={formatMessage({ id: "clearedFieldTooltip" })}
        className={className ?? "ms-auto"}
        visibleElement={
          <span className="badge pill bg-warning">
            <i>{formatMessage({ id: "cleared" })}</i>
          </span>
        }
      />
    );
  }

  // Show Deleted badge if explicitly deleted
  if (bulkTab.isExplicitlyDeleted) {
    return (
      <Tooltip
        directText={formatMessage({ id: "deletedTooltip" })}
        className={className ?? "ms-auto"}
        visibleElement={
          <span className="badge pill bg-danger">
            <i>{formatMessage({ id: "deleted" })}</i>
          </span>
        }
      />
    );
  }

  // Show Changes made badge if bulk edit value is set (and not cleared)
  if (bulkTab.hasBulkEditValue) {
    return (
      <Tooltip
        directText={formatMessage({ id: "changesMadeTooltip" })}
        className={className ?? "ms-auto"}
        visibleElement={
          <span className="badge pill bg-success">
            <i>{formatMessage({ id: "changesMade" })}</i>
          </span>
        }
      />
    );
  }

  // Default: No changes badge
  return (
    <Tooltip
      directText={formatMessage({ id: "noChangesMadeTooltip" })}
      className={className ?? "ms-auto"}
      visibleElement={
        <span className="badge pill bg-secondary">
          <i>{formatMessage({ id: "noChangesMade" })}</i>
        </span>
      }
    />
  );
}
