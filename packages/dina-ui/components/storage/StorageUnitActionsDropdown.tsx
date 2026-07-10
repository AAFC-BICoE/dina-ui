import { useRouter } from "next/router";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { Tooltip } from "common-ui";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { StorageUnit } from "../../types/collection-api";
import { StorageActionMode } from "./StorageUnitChildrenViewer";

export interface StorageUnitActionsDropdownProps {
  storageUnit: StorageUnit;
  hasContents: boolean;
  activeMode: StorageActionMode;
  onAction: (mode: StorageActionMode) => void;
}

export function StorageUnitActionsDropdown({
  storageUnit,
  hasContents,
  activeMode,
  onAction
}: StorageUnitActionsDropdownProps) {
  const router = useRouter();

  if (storageUnit.isGeneric) {
    return null;
  }

  const isActive = activeMode !== "VIEW";

  return (
    <div className="d-inline-block">
      <DropdownButton
        id="storage-unit-actions-dropdown"
        title={<DinaMessage id="actions" />}
        variant={isActive ? "secondary" : "primary"}
      >
        <Dropdown.Item
          onClick={() => hasContents && onAction("MOVE_ALL")}
          className={!hasContents ? "disabled" : undefined}
          style={{ pointerEvents: !hasContents ? "auto" : undefined }}
        >
          <DinaMessage id="moveAllContent" />{" "}
          <Tooltip id="moveAllContent_tooltip" />
        </Dropdown.Item>
        <Dropdown.Item onClick={() => onAction("ADD_EXISTING_AS_CHILD")}>
          <DinaMessage id="addExistingStorageUnitAsChild" />{" "}
          <Tooltip id="addExistingStorageUnitAsChild_tooltip" />
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() =>
            router.push(
              `/collection/storage-unit/edit?parentId=${storageUnit.id}`
            )
          }
        >
          <DinaMessage id="addNewChildStorageUnit" />{" "}
          <Tooltip id="addNewChildStorageUnit_tooltip" />
        </Dropdown.Item>
      </DropdownButton>
    </div>
  );
}
