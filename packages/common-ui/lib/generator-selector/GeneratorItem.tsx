import { Button, Card, Stack } from "react-bootstrap";
import { FaArrowDown, FaArrowUp, FaTrash } from "react-icons/fa";
import { GeneratorColumn } from "./GeneratorSelector";

export interface GeneratorItemProps {
  column: GeneratorColumn;

  onGeneratorItemDelete: (columnValue: string) => void;
  onGeneratorItemChangeOrder: (
    direction: "up" | "down",
    columnValue: string
  ) => void;
  onGeneratorItemChangeAlias: (aliasValue: string, columnValue: string) => void;

  /** Used to determine if the sort up arrow should be disabled. */
  isTop: boolean;

  /** Used to determine if the sort down arrow should be disabled. */
  isBottom: boolean;

  /** Should all the options on the column item be disabled. (Useful when exporting to prevent edits) */
  isDisabled: boolean;
}

export function GeneratorItem({
  column,
  onGeneratorItemDelete,
  onGeneratorItemChangeOrder,
  onGeneratorItemChangeAlias,
  isTop,
  isBottom,
  isDisabled
}: GeneratorItemProps) {
  return (
    <>
      <Card className="mt-2">
        <Card.Body style={{ padding: "0.5rem 0.5rem" }}>
          <Stack direction="horizontal" gap={1}>
            {/* Name of the Column */}
            <span
              className="mt-0 mb-0"
              style={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap"
              }}
            >
              {column.columnLabel}
            </span>

            {/* Header */}
            <input
              type="text"
              className="ms-auto form-control me-2"
              style={{ width: "500px" }}
              value={column.columnAlias}
              placeholder={column.columnLabel}
              disabled={isDisabled}
              onChange={(e) =>
                onGeneratorItemChangeAlias(e.target.value, column.columnValue)
              }
            />

            {/* Order Up Button */}
            <Button
              variant="light"
              disabled={isTop || isDisabled}
              className={""}
              onClick={() =>
                onGeneratorItemChangeOrder("up", column.columnValue)
              }
              data-testid="move-up-button"
            >
              <FaArrowUp />
            </Button>

            {/* Order Down Button */}
            <Button
              className="ms-1"
              variant="light"
              disabled={isBottom || isDisabled}
              onClick={() =>
                onGeneratorItemChangeOrder("down", column.columnValue)
              }
              data-testid="move-down-button"
            >
              <FaArrowDown />
            </Button>

            {/* Delete Column */}
            <Button
              className="ms-1"
              variant="danger"
              disabled={isDisabled}
              onClick={() => onGeneratorItemDelete(column.columnValue)}
              data-testid="delete-button"
            >
              <FaTrash />
            </Button>
          </Stack>
        </Card.Body>
      </Card>
    </>
  );
}
