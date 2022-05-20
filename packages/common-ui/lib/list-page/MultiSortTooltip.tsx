import { Tooltip } from "../tooltip/Tooltip";
import { CommonMessage } from "../intl/common-ui-intl";

export function MultiSortTooltip() {
  return (
    <div className="flex-grow-1">
      <Tooltip
        id="queryTableMultiSortExplanation"
        visibleElement={
          <a href="#" aria-describedby={"queryTableMultiSortExplanation"}>
            <CommonMessage id="queryTableMultiSortTooltipTitle" />
          </a>
        }
      />
    </div>
  );
}
