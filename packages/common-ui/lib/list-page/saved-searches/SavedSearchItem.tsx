import { Card, Button } from "react-bootstrap";
import { SingleSavedSearch } from "./types";
import { FaTrash } from "react-icons/fa";
import { DefaultBadge } from "./DefaultBadge";

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
            : undefined
      }}
    >
      <Card.Body
        onClick={() => onSavedSearchSelected(savedSearch.savedSearchName ?? "")}
      >
        <Card.Title>
          {savedSearch?.savedSearchName}
          <DefaultBadge displayBadge={savedSearch.default} />
          <Button
            className="float-end"
            variant="danger"
            onClick={() =>
              onSavedSearchDelete(savedSearch.savedSearchName ?? "")
            }
          >
            <FaTrash />
          </Button>
        </Card.Title>
      </Card.Body>
    </Card>
  );
}
