import { Treebeard } from "react-treebeard";
import { useState } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
export interface TreeViewProps {
  data: any;
  onClick?: (node) => void;
  className?: string;
}
export function TreeView(props: TreeViewProps) {
  const { data, className, onClick } = props;
  const [treeData, setTreeData] = useState(data);
  const [cursor, setCursor] = useState({ active: false });

  const onToggleInternal = (node, toggled) => {
    if (cursor) {
      cursor.active = false;
    }
    node.active = true;
    if (node.children) {
      node.toggled = toggled;
    }
    setCursor(node);
    setTreeData(Object.assign({}, data));
    onClick?.(node);
  };
  return (
    <label className={"w-100 mb-3"}>
      <div className="mb-2">
        <strong>
          <DinaMessage id="childStorageUnitLabel" />
        </strong>
      </div>
      {data ? (
        <Treebeard data={treeData} className={`col-md-6 mb-2 ${className}`} />
      ) : (
        <div className="mb-2">
          <DinaMessage id="none" />{" "}
        </div>
      )}
    </label>
  );
}
