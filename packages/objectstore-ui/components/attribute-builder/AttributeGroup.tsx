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
      <style jsx={true}>{`
        .list-inline {
          padding-left: 0;
          list-style: none;
        }
        .list-inline-item {
          display: inline-block;
        }
        .card {
          margin-bottom: 15px;
        }
        .card-body {
          -webkit-box-flex: 1;
          -ms-flex: 1 1 auto;
          flex: 1 1 auto;
          padding: 1.25rem;
        }
        .d-inline-block {
          display: inline-block !important;
        }
      `}</style>
    </div>
  );
}
