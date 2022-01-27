import RcTooltip from "rc-tooltip";
import { ReactNode, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";

interface TooltipProps {
  /** The ID of the message to show in the tooltip. */
  id?: string;

  /** Intl message arguments */
  intlValues?: Record<string, any>;

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

  setVisible?: React.Dispatch<React.SetStateAction<boolean>>;
  visible?: boolean;
}

export function Tooltip({
  id,
  intlValues,
  visibleElement,
  link,
  linkText,
  image,
  altImage,
  setVisible,
  visible
}: TooltipProps) {
  // Setup the internationalization functions.
  const { messages, formatMessage } = useIntl();
  let [popupVisible, setPopupVisible] = useState(false);
  if (setVisible && visible) {
    setPopupVisible = setVisible;
    popupVisible = visible;
  }

  // Determine if a tooltip message needs to be displayed.
  const tooltipMessage =
    id != null ? <FormattedMessage id={id} values={intlValues} /> : null;

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
        <a href={link} style={{ color: "white" }} className={"mrgn-tp-sm"}>
          <FormattedMessage
            id={linkText == null ? "tooltipDefaultLinkMessage" : linkText}
          />
        </a>
      </div>
    ) : null;

  return (
    <span className="m-2">
      <RcTooltip
        id={id}
        overlay={
          <div style={{ maxWidth: "25rem", whiteSpace: "pre-wrap" }}>
            {tooltipMessage}
            {tooltipImage}
            {tooltipLink}
          </div>
        }
        placement="top"
        trigger={["focus", "hover"]}
        visible={popupVisible}
      >
        <span>
          {visibleElement ?? (
            <img
              src="/static/images/iconInformation.gif"
              alt={id ? formatMessage({ id }) : ""}
              tabIndex={0}
              onKeyUp={e =>
                e.key === "Escape"
                  ? setPopupVisible(false)
                  : setPopupVisible(true)
              }
              onMouseOver={() => setPopupVisible(true)}
              onMouseOut={() => setPopupVisible(false)}
              onBlur={() => setPopupVisible(false)}
            />
          )}
        </span>
      </RcTooltip>
    </span>
  );
}
