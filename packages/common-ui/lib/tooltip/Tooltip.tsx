import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import ReactTooltip from "react-tooltip";

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
      <span data-tip={true} data-for={id}>
        {visibleElement ?? <img src="/static/images/iconInformation.gif" />}
      </span>
      <ReactTooltip id={id}>
        <div style={{ maxWidth: "15rem" }}>
          <FormattedMessage id={id} />
        </div>
      </ReactTooltip>
    </span>
  );
}
