import { FieldSet } from "common-ui";
import React, { useMemo } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";

export interface SidebarOption {
  id: string;
  label: string;
  count?: number;
}

export interface TypeFilterState {
  parent_cv_ids: string[];
  children?: string[];
}

export interface TypeFilterSideBarDynamicProps {
  parents: SidebarOption[];
  /** Data components of the Managed Attribute vocabularies, by vocabulary id. */
  childrenMap?: Record<string, SidebarOption[]>;
  selected: TypeFilterState;
  onChange: (next: TypeFilterState) => void;
}

/**
 * Sidebar filters for the controlled vocabulary list.
 * Every vocabulary is listed under "Filter by Type". The data components of the Managed Attribute
 * vocabularies are also listed under "Managed Attributes". Selecting a data component selects its
 * vocabulary, and deselecting the vocabulary deselects its data components.
 */
export function TypeFilterSideBarDynamic({
  parents,
  childrenMap = {},
  selected,
  onChange
}: TypeFilterSideBarDynamicProps) {
  // Vocabularies with data components listed under "Managed Attributes"
  const componentParents = useMemo(
    () => parents.filter((p) => (childrenMap[p.id]?.length ?? 0) > 0),
    [parents, childrenMap]
  );

  const selectedParentSet = useMemo(
    () => new Set(selected.parent_cv_ids ?? []),
    [selected.parent_cv_ids]
  );
  const selectedChildSet = useMemo(
    () => new Set(selected.children ?? []),
    [selected.children]
  );

  // "All" stats for the Managed Attributes section
  const allComponentsStats = useMemo(() => {
    const components = componentParents.flatMap((p) =>
      childrenMap[p.id].map((c) => ({ parentId: p.id, child: c }))
    );
    const selectedCount = components.filter(
      ({ parentId, child }) =>
        selectedParentSet.has(parentId) && selectedChildSet.has(child.id)
    ).length;
    const totalCount = components.reduce(
      (sum, { child }) => sum + Math.max(child.count ?? 0, 0),
      0
    );

    return {
      checked: components.length > 0 && selectedCount === components.length,
      indeterminate: selectedCount > 0 && selectedCount < components.length,
      totalCount
    };
  }, [componentParents, childrenMap, selectedParentSet, selectedChildSet]);

  // "All Types" stats for the Filter by Type section
  const allTypesStats = useMemo(() => {
    const selectedCount = parents.filter((p) =>
      selectedParentSet.has(p.id)
    ).length;
    const totalCount = parents.reduce(
      (sum, p) => sum + Math.max(displayCount(p), 0),
      0
    );

    return {
      checked: parents.length > 0 && selectedCount === parents.length,
      indeterminate: selectedCount > 0 && selectedCount < parents.length,
      totalCount
    };
  }, [parents, selectedParentSet]);

  // --- Selection helpers ---

  /** Selects a vocabulary with all of its data components. */
  function selectParent(
    parentSet: Set<string>,
    childSet: Set<string>,
    parentId: string
  ) {
    parentSet.add(parentId);
    (childrenMap[parentId] ?? []).forEach((c) => childSet.add(c.id));
  }

  /** Deselects a vocabulary with all of its data components. */
  function deselectParent(
    parentSet: Set<string>,
    childSet: Set<string>,
    parentId: string
  ) {
    parentSet.delete(parentId);
    (childrenMap[parentId] ?? []).forEach((c) => {
      // Keep a data component that another selected vocabulary still filters on.
      const stillHasChild = Array.from(parentSet).some((pid) =>
        (childrenMap[pid] ?? []).some((k) => k.id === c.id)
      );
      if (!stillHasChild) {
        childSet.delete(c.id);
      }
    });
  }

  function emitChange(parentSet: Set<string>, childSet: Set<string>) {
    onChange({
      parent_cv_ids: Array.from(parentSet),
      children: Array.from(childSet)
    });
  }

  // --- Handlers ---

  const handleToggleAllComponents = () => {
    const nextParentSet = new Set(selectedParentSet);
    const nextChildSet = new Set(selectedChildSet);
    componentParents.forEach((p) =>
      allComponentsStats.checked
        ? deselectParent(nextParentSet, nextChildSet, p.id)
        : selectParent(nextParentSet, nextChildSet, p.id)
    );
    emitChange(nextParentSet, nextChildSet);
  };

  const handleToggleAllTypes = () => {
    const nextParentSet = new Set<string>();
    const nextChildSet = new Set<string>();
    if (!allTypesStats.checked) {
      parents.forEach((p) => selectParent(nextParentSet, nextChildSet, p.id));
    }
    emitChange(nextParentSet, nextChildSet);
  };

  const handleToggleType = (parentId: string) => {
    const nextParentSet = new Set(selectedParentSet);
    const nextChildSet = new Set(selectedChildSet);
    if (selectedParentSet.has(parentId)) {
      deselectParent(nextParentSet, nextChildSet, parentId);
    } else {
      selectParent(nextParentSet, nextChildSet, parentId);
    }
    emitChange(nextParentSet, nextChildSet);
  };

  const handleToggleChild = (childId: string, parentId: string) => {
    const nextChildSet = new Set(selectedChildSet);
    const nextParentSet = new Set(selectedParentSet);

    // A child is "checked" in the UI only when both the child and its specific
    // parent are selected.
    const isCurrentlyChecked =
      selectedChildSet.has(childId) && selectedParentSet.has(parentId);

    if (isCurrentlyChecked) {
      // Unchecking this child under this parent
      nextChildSet.delete(childId);
      // If no other children of this parent remain selected, remove the parent
      const siblings = childrenMap[parentId] ?? [];
      const anySiblingSelected = siblings.some(
        (s) => s.id !== childId && nextChildSet.has(s.id)
      );
      if (!anySiblingSelected) {
        nextParentSet.delete(parentId);
      }
      // Restore the child to the global set only if a "different" selected parent still
      // has it — otherwise we'd incorrectly remove a filter that still applies across parents.
      const stillHasChild = Array.from(nextParentSet).some((pid) => {
        if (pid === parentId) return false;
        const kids = childrenMap[pid] ?? [];
        return kids.some((k) => k.id === childId);
      });
      if (stillHasChild) {
        nextChildSet.add(childId);
      }
    } else {
      // Checking this child under this parent — also select its parent.
      nextChildSet.add(childId);
      nextParentSet.add(parentId);
    }

    emitChange(nextParentSet, nextChildSet);
  };

  return (
    <>
      {componentParents.length > 0 && (
        <FieldSet
          legend={<DinaMessage id="managedAttributes" />}
          id="cv-managed-attributes-filter"
        >
          <ul className="list-unstyled m-0">
            <FilterCheckboxRow
              id="cv-select-all-components"
              label={<DinaMessage id="all" />}
              count={allComponentsStats.totalCount}
              checked={allComponentsStats.checked}
              indeterminate={allComponentsStats.indeterminate}
              onChange={handleToggleAllComponents}
            />
            {componentParents.flatMap((p) =>
              childrenMap[p.id].map((c) => {
                // Use a compound key so children with the same name
                // under different parents are treated independently.
                const compoundId = `${p.id}::${c.id}`;
                return (
                  <FilterCheckboxRow
                    key={compoundId}
                    id={`cv-child-${compoundId}`}
                    label={c.label}
                    count={c.count}
                    checked={
                      selectedChildSet.has(c.id) && selectedParentSet.has(p.id)
                    }
                    onChange={() => handleToggleChild(c.id, p.id)}
                  />
                );
              })
            )}
          </ul>
        </FieldSet>
      )}

      <FieldSet legend={<DinaMessage id="filterByType" />} id="cv-type-filter">
        {parents.length ? (
          <ul className="list-unstyled m-0">
            <FilterCheckboxRow
              id="cv-select-all"
              label={<DinaMessage id="allTypes" />}
              count={allTypesStats.totalCount}
              checked={allTypesStats.checked}
              indeterminate={allTypesStats.indeterminate}
              onChange={handleToggleAllTypes}
            />
            {parents.map((p) => (
              <FilterCheckboxRow
                key={p.id}
                id={`cv-${p.id}`}
                label={p.label}
                count={displayCount(p)}
                checked={selectedParentSet.has(p.id)}
                onChange={() => handleToggleType(p.id)}
              />
            ))}
          </ul>
        ) : (
          <div className="text-muted small">
            <DinaMessage id="noFiltersAvailable" />
          </div>
        )}
      </FieldSet>
    </>
  );
}

/** A parent without a loaded count represents a single type. */
function displayCount(option: SidebarOption): number {
  return typeof option.count === "number" ? option.count : 1;
}

interface FilterCheckboxRowProps {
  id: string;
  label: React.ReactNode;
  count?: number;
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}

/** Checkbox with its label on the left and its count badge on the right. */
function FilterCheckboxRow({
  id,
  label,
  count,
  checked,
  indeterminate = false,
  onChange
}: FilterCheckboxRowProps) {
  return (
    <li className="d-flex align-items-center justify-content-between py-1">
      <div className="form-check m-0">
        <input
          id={id}
          type="checkbox"
          className="form-check-input"
          checked={checked}
          ref={(el) => {
            if (el) el.indeterminate = indeterminate;
          }}
          onChange={onChange}
        />
        <label htmlFor={id} className="form-check-label">
          {label}
        </label>
      </div>
      {/* Hide the badge when the count is unknown (-1) or empty */}
      {typeof count === "number" && count > 0 && (
        <span className="badge bg-secondary ms-2">{count}</span>
      )}
    </li>
  );
}
