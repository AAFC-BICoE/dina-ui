import { Tooltip } from "../tooltip/Tooltip";
import { CommonMessage } from "../intl/common-ui-intl";

export function MultiSortTooltip() {
  return (
    <div className="ms-auto">
      <Tooltip id="queryTableMultiSortExplanation" placement="left" />
    </div>
  );
}
