import { Card, Button, Stack } from "react-bootstrap";
import { SingleSavedSearch } from "./types";
import { FaTrash } from "react-icons/fa";
import { DefaultBadge } from "./SavedSearchBadges";

interface SavedSearchItemProps {
  savedSearch?: SingleSavedSearch;
  currentSavedSearchName: string;
  onSavedSearchSelected: (savedSearchName: string) => void;
  onSavedSearchDelete: (savedSearchName: string) => void;
}

export function SavedSearchItem({
  savedSearch,
  currentSavedSearchName,
  onSavedSearchSelected,
  onSavedSearchDelete
}: SavedSearchItemProps) {
  if (!savedSearch || !savedSearch.savedSearchName) {
    return <></>;
  }

  return (
    <Card
      className="mt-2"
      style={{
        border:
          currentSavedSearchName === savedSearch.savedSearchName
            ? "2px solid #007bff"
            : undefined,
        cursor: "pointer"
      }}
    >
      <Card.Body
        onClick={() => onSavedSearchSelected(savedSearch.savedSearchName ?? "")}
      >
        <Card.Text>
          <Stack direction="horizontal" gap={3}>
            <p
              className="mt-0 mb-0"
              style={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap"
              }}
            >
              {savedSearch?.savedSearchName}
            </p>
            <DefaultBadge displayBadge={savedSearch.default} />
            <Button
              className="ms-auto"
              variant="danger"
              onClick={() =>
                onSavedSearchDelete(savedSearch.savedSearchName ?? "")
              }
            >
              <FaTrash />
            </Button>
          </Stack>
        </Card.Text>
      </Card.Body>
    </Card>
  );
}
