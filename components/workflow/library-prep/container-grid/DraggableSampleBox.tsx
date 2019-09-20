import { useDrag } from "react-dnd-cjs";

export function DraggableSampleBox({
  onClick = e => undefined,
  sample,
  selected
}) {
  const [, drag] = useDrag({
    item: { sample, type: "sample" }
  });

  return (
    <li
      className="list-group-item"
      onClick={onClick}
      ref={drag}
      style={{
        backgroundColor: selected && "rgb(222, 252, 222)",
        cursor: "move"
      }}
    >
      {sample.name}
    </li>
  );
}
