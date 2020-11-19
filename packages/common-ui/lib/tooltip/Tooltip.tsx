import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import RcTooltip from "rc-tooltip";

export interface TooltipProps {
  /** The ID of the message to show in the tooltip. */
  id: string;

  /**
   * The element shown that you hover on to see the tooltip.
   * Default is a small "i" image.
   */
  visibleElement?: ReactNode;
}

export function Tooltip({ id, visibleElement }: TooltipProps) {
  return (
    <span className="m-2">
      <RcTooltip
        overlay={
          <div style={{ maxWidth: "15rem" }}>
            <FormattedMessage id={id} />
          </div>
        }
        placement="top"
      >
        <span>
          {visibleElement ?? <img src="/static/images/iconInformation.gif" />}
        </span>
      </RcTooltip>
    </span>
  );
}
