import _ from "lodash";
import { useDrag } from "react-dnd";
import RcTooltip from "rc-tooltip";
import Link from "next/link";

interface DraggableItemBoxProps<ItemType extends { sampleName?: string }> {
  onClick?: (e: any) => void;
  batchItemSample: ItemType;
  coordinates: string | null;
  selected: boolean;
  wasMoved: boolean;
  editMode: boolean;
}

export const ITEM_BOX_DRAG_KEY = "materialSampleItem";

export function DraggableItemBox<
  ItemType extends { sampleId?: string; sampleName?: string }
>({
  onClick = _.noop,
  batchItemSample,
  coordinates,
  selected,
  wasMoved,
  editMode
}: DraggableItemBoxProps<ItemType>) {
  const [, drag] = useDrag({
    type: ITEM_BOX_DRAG_KEY,
    item: { batchItemSample, type: ITEM_BOX_DRAG_KEY },
    canDrag: () => {
      return editMode;
    }
  });

  const backgroundColor = () => {
    if (editMode) {
      if (selected) {
        return "#defcde";
      }
      if (wasMoved) {
        return "#fff3cd";
      }
    }

    return undefined;
  };

  // Primer name can be supplied, only displayed if provided.
  const primerName = (batchItemSample as any)?.primerName ?? undefined;

  return (
    <li className="list-group-item p-0" onClick={onClick} ref={drag as any}>
      <RcTooltip
        placement="top"
        trigger={coordinates ? "hover" : ""}
        overlay={
          <>
            {coordinates && (
              <div style={{ maxWidth: "15rem" }}>
                <>
                  {coordinates}
                  <br />
                  {batchItemSample.sampleName}
                  {primerName && (
                    <>
                      <br />
                      {primerName}
                    </>
                  )}
                </>
              </div>
            )}
          </>
        }
      >
        <div
          className="move-status-indicator list-group-item"
          style={{
            backgroundColor: backgroundColor(),
            cursor: editMode ? "move" : "default"
          }}
        >
          <span className="sample-box-text">
            {batchItemSample.sampleId && !editMode ? (
              <Link
                href={`/collection/material-sample/view?id=${batchItemSample.sampleId}`}
                legacyBehavior
              >
                {batchItemSample.sampleName}
              </Link>
            ) : (
              batchItemSample.sampleName
            )}
            {primerName && <> ({primerName})</>}
          </span>
        </div>
      </RcTooltip>
    </li>
  );
}
