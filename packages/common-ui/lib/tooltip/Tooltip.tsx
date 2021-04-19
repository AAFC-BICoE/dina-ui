import RcTooltip from "rc-tooltip";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

export interface TooltipProps {
  /** The ID of the message to show in the tooltip. */
  id: string;

  /** Intl message arguments */
  intlValues?: Record<string, any>;

  /**
   * The element shown that you hover on to see the tooltip.
   * Default is a small "i" image.
   */
  visibleElement?: ReactNode;
}

export function Tooltip({ id, intlValues, visibleElement }: TooltipProps) {
  return (
    <span className="m-2">
      <RcTooltip
        id={id}
        overlay={
          <div style={{ maxWidth: "15rem", whiteSpace: "pre-wrap" }}>
            <FormattedMessage id={id} values={intlValues} />
          </div>
        }
        placement="top"
      >
        <span>
          {visibleElement ?? (
            <img
              src="/static/images/iconInformation.gif"
              alt=""
              aria-describedby={id}
            />
          )}
        </span>
      </RcTooltip>
    </span>
  );
}
