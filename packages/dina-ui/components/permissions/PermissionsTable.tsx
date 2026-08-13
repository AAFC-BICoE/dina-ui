import { ReactTable, LoadingSpinner } from "common-ui";
import { useAvailableGroupOptions } from "../group-select/GroupSelectField";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import Select from "react-select";
import { useState, useEffect } from "react";
import classNames from "classnames";
import { FaCheck, FaTimes } from "react-icons/fa";
import { usePermissionsCheck } from "./usePermissionsCheck";

/**
 * A single row in the permissions table: whether the current user
 * can perform each operation on a given resource type.
 */
export interface ResourcePermission {
  /** Intl message key for the resource display name. */
  resourceKey: string;
  /** Whether the user can read this resource. */
  read: boolean;
  /** Whether the user can create this resource. */
  create: boolean;
  /** Whether the user can edit this resource. */
  edit: boolean;
  /** Whether the user can delete this resource. */
  delete: boolean;
  /** Whether the backend service for this resource is unavailable */
  unavailable?: boolean;
}

export function PermissionsTable() {
  const { formatMessage } = useDinaIntl();

  // Reuse the standard group options hook (fetches user-api/group, applies labels).
  const { groupSelectOptions } = useAvailableGroupOptions();

  // Pick the first available group by default.
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  useEffect(() => {
    if (!selectedGroup && groupSelectOptions.length > 0) {
      setSelectedGroup(groupSelectOptions[0].value);
    }
  }, [groupSelectOptions, selectedGroup]);

  // Fetch permissions from the backend whenever the selected group changes.
  const { permissionsData: fetchedPermissions, loading } =
    usePermissionsCheck(selectedGroup);

  const tableData = fetchedPermissions ?? [];

  const columns = [
    {
      header: () => <DinaMessage id="resource" />,
      accessorKey: "resourceKey",
      cell: ({ row: { original } }: any) => (
        <strong>
          <DinaMessage id={original.resourceKey} />
        </strong>
      ),
      meta: { className: "fw-bold" }
    },
    {
      header: () => <DinaMessage id="operation_read" />,
      accessorKey: "read",
      cell: ({ row: { original } }: any) => (
        <PermissionCell
          permitted={original.read}
          unavailable={original.unavailable}
        />
      )
    },
    {
      header: () => <DinaMessage id="operation_create" />,
      accessorKey: "create",
      cell: ({ row: { original } }: any) => (
        <PermissionCell
          permitted={original.create}
          unavailable={original.unavailable}
        />
      )
    },
    {
      header: () => <DinaMessage id="operation_edit" />,
      accessorKey: "edit",
      cell: ({ row: { original } }: any) => (
        <PermissionCell
          permitted={original.edit}
          unavailable={original.unavailable}
        />
      )
    },
    {
      header: () => <DinaMessage id="operation_delete" />,
      accessorKey: "delete",
      cell: ({ row: { original } }: any) => (
        <PermissionCell
          permitted={original.delete}
          unavailable={original.unavailable}
        />
      )
    }
  ];

  return (
    <div className="mb-3">
      <h2 className="mb-3">
        <DinaMessage id="tableTitle_permissions" />
      </h2>

      {selectedGroup && (
        <div className="d-flex align-items-center gap-2 mb-3">
          {groupSelectOptions.length > 1 && (
            <div style={{ minWidth: 180 }}>
              <Select
                options={groupSelectOptions}
                value={groupSelectOptions.find(
                  (opt) => opt.value === selectedGroup
                )}
                onChange={(opt) => setSelectedGroup(opt?.value ?? "")}
                placeholder={formatMessage("selectGroup")}
                isSearchable={false}
                aria-label={formatMessage("selectGroup")}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : undefined
                }
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
            </div>
          )}
        </div>
      )}

      {loading ? (
        <LoadingSpinner loading={true} />
      ) : (
        <ReactTable
          className={classNames("-striped")}
          highlightRow={false}
          columns={columns}
          data={tableData}
          showPagination={false}
          manualPagination={true}
          enableSorting={false}
        />
      )}
    </div>
  );
}

function PermissionCell({
  permitted,
  unavailable
}: {
  permitted: boolean;
  unavailable?: boolean;
}) {
  if (unavailable) {
    return (
      <span className="d-inline-flex align-items-center gap-1 text-muted">
        <FaTimes />
        <DinaMessage id="permission_unavailable" />
      </span>
    );
  }
  return (
    <span
      className={classNames(
        "d-inline-flex align-items-center gap-1",
        permitted ? "text-success" : "text-danger"
      )}
    >
      {permitted ? <FaCheck /> : <FaTimes />}
      <DinaMessage
        id={permitted ? "permission_allowed" : "permission_denied"}
      />
    </span>
  );
}
