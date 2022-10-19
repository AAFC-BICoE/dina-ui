import { Card, Button } from "react-bootstrap";
import { SingleSavedSearch } from "./types";
import { FaTrash } from "react-icons/fa";
import { DefaultBadge } from "./DefaultBadge";

interface SavedSearchItemProps {
  savedSearch?: SingleSavedSearch;
  onSavedSearchSelected: (savedSearchName: string) => void;
  onSavedSearchDelete: (savedSearchName: string) => void;
}

export function SavedSearchItem({
  savedSearch,
  onSavedSearchSelected,
  onSavedSearchDelete
}: SavedSearchItemProps) {
  if (!savedSearch || !savedSearch.savedSearchName) {
    return <></>;
  }

  return (
    <Card className="mt-2">
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
