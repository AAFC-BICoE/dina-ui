import { Button, Card, Stack } from "react-bootstrap";
import { FaArrowDown, FaArrowUp, FaTrash } from "react-icons/fa";
import { TableColumn } from "../list-page/types";
import { KitsuResource } from "kitsu";

export interface ColumnItemProps<TData extends KitsuResource> {
  column: TableColumn<TData>;
  onColumnItemDelete: (columnId: string) => void;
  onColumnItemChangeOrder: (direction: "up" | "down", columnId: string) => void;

  /** Used to determine if the sort up arrow should be disabled. */
  isTop: boolean;

  /** Used to determine if the sort down arrow should be disabled. */
  isBottom: boolean;

  /** Used to determine if the delete button should be disbaled. */
  isMandatoryField: boolean;
}

export function ColumnItem<TData extends KitsuResource>({
  column,
  onColumnItemDelete,
  onColumnItemChangeOrder,
  isTop,
  isBottom,
  isMandatoryField
}: ColumnItemProps<TData>) {
  return (
    <>
      <Card className="mt-2">
        <Card.Body style={{ padding: "0.5rem 0.5rem" }}>
          <Card.Text>
            <Stack direction="horizontal" gap={1}>
              {/* Name of the Column */}
              <p
                className="mt-0 mb-0"
                style={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap"
                }}
              >
                {(column as any)?.header()}
              </p>

              {/* Order Up Button */}
              <Button
                className="ms-auto"
                variant="light"
                disabled={isTop}
                onClick={() =>
                  column.id && onColumnItemChangeOrder("up", column.id)
                }
              >
                <FaArrowUp />
              </Button>

              {/* Order Down Button */}
              <Button
                className="ms-1"
                variant="light"
                disabled={isBottom}
                onClick={() =>
                  column.id && onColumnItemChangeOrder("down", column.id)
                }
              >
                <FaArrowDown />
              </Button>

              {/* Delete Column */}
              <Button
                className="ms-1"
                variant="danger"
                disabled={isMandatoryField}
                onClick={() => column.id && onColumnItemDelete(column.id)}
              >
                <FaTrash />
              </Button>
            </Stack>
          </Card.Text>
        </Card.Body>
      </Card>
    </>
  );
}
