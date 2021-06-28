import { Treebeard } from "react-treebeard";
import { useState } from "react";
import defaultTheme from "react-treebeard/dist/themes/default";

export interface TreeViewProps {
  data: any;
  onClick?: (node) => void;
  className?: string;
}
export function TreeView(props: TreeViewProps) {
  const { data, onClick, className } = props;

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

  // cutomization for back ground color
  const myTheme = {
    ...defaultTheme.tree?.base,
    color: "black",
    backgroundColor: "white"
  };

  return (
    <Treebeard
      // There is error thrown from Treebeard component
      // Unhandled Runtime Error
      // TypeError: Cannot read property 'base' of undefined
      // Comment out below line until the bug is fixed
      //       style={{myTheme}}
      data={treeData}
      onToggle={onToggleInternal}
      className={className}
    />
  );
}
