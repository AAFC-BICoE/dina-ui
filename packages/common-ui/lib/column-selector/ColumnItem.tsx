import { Button, Card, Stack } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import { TableColumn } from "../list-page/types";
import { KitsuResource } from "kitsu";

export interface ColumnItemProps<TData extends KitsuResource> {
  column: TableColumn<TData>;
  onColumnItemDelete: (columnId: string) => void;
  isMandatoryField: boolean;
}

export function ColumnItem<TData extends KitsuResource>({
  column,
  onColumnItemDelete,
  isMandatoryField
}: ColumnItemProps<TData>) {
  return (
    <>
      <Card className="mt-2">
        <Card.Body style={{ padding: "0.5rem 0.5rem" }}>
          <Card.Text>
            <Stack direction="horizontal" gap={3}>
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

              {/* Delete Column */}
              <Button
                className="ms-auto"
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
