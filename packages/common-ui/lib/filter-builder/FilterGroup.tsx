import { useIntl } from "react-intl";
import { CommonMessage } from "../intl/common-ui-intl";
import { FilterRowModel } from "./FilterRow";

export type FilterGroupOperator = "AND" | "OR";

export interface FilterGroupModel {
  id: number;
  type: "FILTER_GROUP";
  operator: FilterGroupOperator;
  children: (FilterRowModel | FilterGroupModel)[];
}

export interface FilterGroupProps {
  model: FilterGroupModel;
  children: JSX.Element[];
  showAndOrButtons: boolean;
  showRemoveButton: boolean;
  onAndClick: () => void;
  onRemoveClick: () => void;
  onOrClick: () => void;
}

export function FilterGroup({
  children,
  model,
  onAndClick,
  onRemoveClick,
  onOrClick,
  showAndOrButtons,
  showRemoveButton
}: FilterGroupProps) {
  const { formatMessage } = useIntl();

  return (
    <div className="list-inline">
      <div className="card card-body list-inline-item d-inline-block">
        {children.map((element, i) => (
          <div key={i}>
            {element}
            <div className="text-center" data-testid="group-operator">
              {i !== children.length - 1 &&
                formatMessage({ id: model.operator })}
            </div>
          </div>
        ))}
      </div>
      <div className="filter-group-buttons list-inline-item">
        {showAndOrButtons && (
          <div>
            <button
              className="btn btn-primary d-block and"
              onClick={onAndClick}
              type="button"
            >
              <CommonMessage id="AND" />
            </button>
            <button
              className="btn btn-primary d-block or"
              onClick={onOrClick}
              type="button"
            >
              <CommonMessage id="OR" />
            </button>
          </div>
        )}
        {showRemoveButton && (
          <button
            className="btn btn-dark d-block remove"
            onClick={onRemoveClick}
            type="button"
            data-testid="group-delete-button"
          >
            -
          </button>
        )}
      </div>
    </div>
  );
}
