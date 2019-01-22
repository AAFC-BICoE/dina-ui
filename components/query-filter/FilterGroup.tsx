import { FilterRowModel } from "./FilterRow";

export interface FilterGroupModel {
  type: "FILTER_GROUP";
  operator: "AND" | "OR";
  children: Array<FilterRowModel | FilterGroupModel>;
}

export interface FilterGroupProps {
  model: FilterGroupModel;
  children: JSX.Element[];
  onAndClick: () => void;
  onOrClick: () => void;
}

export function FilterGroup({
  children,
  model,
  onAndClick,
  onOrClick
}: FilterGroupProps) {
  return (
    <div className="card card-body" style={{ display: "inline-block" }}>
      {children.map((element, i) => (
        <div key={i}>
          {element}
          <div className="text-center">
            {i !== children.length - 1 && model.operator}
          </div>
        </div>
      ))}
    </div>
  );
}
