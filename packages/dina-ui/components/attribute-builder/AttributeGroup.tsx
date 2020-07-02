import { AttributeRowModel } from "./AttributeRow";

export interface AttributeGroupModel {
  id: number;
  type: "ATTRIBUTE_GROUP";
  children: Array<AttributeRowModel | AttributeGroupModel>;
}

export interface AttributeGroupProps {
  model: AttributeGroupModel;
  children: JSX.Element[];
}

export function AttributeGroup({ children }: AttributeGroupProps) {
  return (
    <div className="list-inline">
      <div className="card card-body list-inline-item d-inline-block">
        {children.map((element, i) => (
          <div key={i}>
            {element}
            <div className="text-center">{i !== children.length - 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
