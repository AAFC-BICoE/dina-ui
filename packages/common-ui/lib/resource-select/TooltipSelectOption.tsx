import RcTooltip from "rc-tooltip";
import * as React from "react";

export interface ITooltipSelectOptionProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  tooltipText: string;
  /** Tooltip placement override, top is the default. */
  placement?: "top" | "bottom" | "left" | "right";
}

export function TooltipSelectOption({
  className,
  style,
  children,
  tooltipText,
  placement = "top"
}: ITooltipSelectOptionProps) {
  return (
    <div className={className} style={style}>
      <RcTooltip
        overlay={
          <div style={{ maxWidth: "25rem", whiteSpace: "pre-wrap" }}>
            {tooltipText}
          </div>
        }
        placement={placement}
        trigger={["focus", "hover"]}
        zIndex={3001}
      >
        <span>{children}</span>
      </RcTooltip>
    </div>
  );
}
