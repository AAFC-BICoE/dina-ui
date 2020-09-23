import ReactTooltip from "react-tooltip";
import { FormattedMessage } from "react-intl";

export interface TooltipProps {
  id: string;
}

export function Tooltip({ id }: TooltipProps) {
  return (
    <span className="m-2">
      <img
        src="/static/images/iconInformation.gif"
        data-tip={true}
        data-for={id}
      />
      <ReactTooltip id={id}>
        <FormattedMessage id={id} />
      </ReactTooltip>
    </span>
  );
}
