export interface FilterRowModel {
  type: "FILTER_ROW";
  property: string;
  predicate: "IS" | "IS NOT";
  value: string;
}

export interface FilterRowProps {
  model: FilterRowModel;
  onAndClick: () => void;
  onOrClick: () => void;
}

export function FilterRow({ model, onAndClick, onOrClick }: FilterRowProps) {
  return (
    <div className="list-inline">
      <input className="list-inline-item" type="text" value={model.property} />
      <input className="list-inline-item" type="text" value={model.predicate} />
      <input
        className="list-inline-item"
        type="text"
        defaultValue={model.value}
      />
      <button className="list-inline-item" onClick={onAndClick}>
        AND
      </button>
      <button className="list-inline-item" onClick={onOrClick}>
        OR
      </button>
    </div>
  );
}
