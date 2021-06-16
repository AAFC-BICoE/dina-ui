import RcTooltip from "rc-tooltip";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

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
  link?: string,

  /** Image attachment, will display it under the tooltip message. */
  image?: string,

  /** Image accessability text. */
  altImage?: string;
}

export function Tooltip({ id, intlValues, visibleElement, link, image, altImage }: TooltipProps) {

  let tooltipMessage;
  let tooltipImage;
  let tooltipLink;

  // Determine if a tooltip message needs to be displayed.
  if (id != null) {
    tooltipMessage = <FormattedMessage id={id} values={intlValues} />;
  }

  // Determine if an image should be displayed.
  if (image != null) {
    tooltipImage = (
      <div>
        <img src={image} alt={altImage} />
      </div>
    );
  }

  // Determine if a link should be displayed.
  if (link != null) {
    tooltipLink = <a href={link} target="_blank"></a>;
  }

  return (
    <span className="m-2">
      <RcTooltip
        id={id}
        overlay={
          
          <div style={{ maxWidth: "15rem", whiteSpace: "pre-wrap" }}>
            {tooltipMessage}
            {tooltipImage}
            {tooltipLink}
          </div>
        }
        placement="top"
      >
        <span>
          {visibleElement ?? (
            <img src="/static/images/iconInformation.gif" alt="" />
          )}
        </span>
      </RcTooltip>
    </span>
  );
}
