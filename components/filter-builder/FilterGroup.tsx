import { FilterRowModel } from "./FilterRow";

export type FilterGroupOperator = "AND" | "OR";

export interface FilterGroupModel {
  id: number;
  type: "FILTER_GROUP";
  operator: FilterGroupOperator;
  children: Array<FilterRowModel | FilterGroupModel>;
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
  return (
    <div className="list-inline">
      <div className="card card-body list-inline-item d-inline-block">
        {children.map((element, i) => (
          <div key={i}>
            {element}
            <div className="text-center">
              {i !== children.length - 1 && model.operator}
            </div>
          </div>
        ))}
      </div>
      <div className="filter-group-buttons list-inline-item">
        {showAndOrButtons && (
          <div>
            <button className="btn btn-primary d-block" onClick={onAndClick}>
              AND
            </button>
            <button className="btn btn-primary d-block" onClick={onOrClick}>
              OR
            </button>
          </div>
        )}
        {showRemoveButton && (
          <button className="btn btn-dark d-block" onClick={onRemoveClick}>
            -
          </button>
        )}
      </div>
    </div>
  );
}
