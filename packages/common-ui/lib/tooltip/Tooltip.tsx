import RcTooltip from "rc-tooltip";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export interface TooltipProps {
  /** The ID of the message to show in the tooltip. */
  id?: string;

  /** Intl message arguments */
  intlValues?: Record<string, any>;

  /**
   * By-pass localization to provide direct text. This is helpful for user provided content.
   *
   * ID should be used for hard-coded messages.
   */
  directText?: string;

  /**
   * The element shown that you hover on to see the tooltip.
   * Default is a small "i" image.
   */
  visibleElement?: ReactNode;

  /** Link attachment, links will always be opened in a new tab. */
  link?: string;

  /** The text that appears for the link. */
  linkText?: string;

  /** Image attachment, will display it under the tooltip message. */
  image?: string;

  /** Image accessability text. */
  altImage?: string;

  // add margin to tooltip span if true
  disableSpanMargin?: boolean;

  /** Tooltip placement override, top is the default. */
  placement?: "top" | "bottom" | "left" | "right";

  setVisible?: React.Dispatch<React.SetStateAction<boolean>>;
  visible?: boolean;
}

export type tooltipPlacements = "top" | "bottom" | "left" | "right";

export function Tooltip({
  id,
  directText,
  intlValues,
  visibleElement,
  link,
  linkText,
  image,
  altImage,
  disableSpanMargin,
  placement = "top"
}: TooltipProps) {
  // Setup the internationalization functions.
  const { messages, formatMessage } = useIntl();

  // Determine if a tooltip message needs to be displayed.
  const tooltipMessage = directText ? (
    directText
  ) : id ? (
    <FormattedMessage id={id} values={intlValues} />
  ) : null;

  // Determine if an image should be displayed.
  const tooltipImage =
    image != null ? (
      <div style={{ marginTop: "10px" }}>
        <img
          src={image}
          alt={
            altImage && messages[altImage]
              ? formatMessage({ id: altImage })
              : altImage
          }
          tabIndex={0}
          style={{ width: "100%" }}
        />
      </div>
    ) : null;

  // Determine if a link should be displayed.
  const tooltipLink =
    link != null ? (
      <div style={{ marginTop: "10px" }}>
        <a
          href={link}
          target="_blank"
          style={{ color: "white" }}
          className={"mrgn-tp-sm"}
        >
          <FormattedMessage
            id={linkText == null ? "tooltipDefaultLinkMessage" : linkText}
          />
        </a>
      </div>
    ) : null;

  return (
    <span className={disableSpanMargin ? undefined : "m-2"}>
      <RcTooltip
        id={id}
        overlay={
          <div style={{ maxWidth: "25rem", whiteSpace: "pre-wrap" }}>
            {tooltipMessage}
            {tooltipImage}
            {tooltipLink}
          </div>
        }
        placement={placement}
        trigger={["focus", "hover"]}
        zIndex={3001}
      >
        <span>
          {visibleElement ? (
            <span aria-describedby={id} tabIndex={0}>
              {visibleElement}
            </span>
          ) : (
            <img
              src="/static/images/iconInformation.gif"
              alt={id ? formatMessage({ id }) : ""}
              aria-describedby={id}
              tabIndex={0}
            />
          )}
        </span>

        {/* Accessibility input */}
      </RcTooltip>
    </span>
  );
}
