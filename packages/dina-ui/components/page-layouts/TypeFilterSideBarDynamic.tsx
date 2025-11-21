import React, { useMemo, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";

export interface SidebarOption {
  id: string;
  label: string;
  count?: number;
  hasChildren?: boolean;
}

export interface TypeFilterState {
  parent_cv_ids: string[];
  children?: string[];
}

export interface TypeFilterSideBarDynamicProps {
  parents: SidebarOption[];
  childrenMap?: Record<string, SidebarOption[]>;
  loadChildren?: (parentId: string) => Promise<SidebarOption[]> | SidebarOption[];
  selected: TypeFilterState;
  onChange: (next: TypeFilterState) => void;
  title?: string;
}

export function TypeFilterSideBarDynamic({
  parents,
  childrenMap,
  loadChildren,
  selected,
  onChange,
  title = "Filters",
}: TypeFilterSideBarDynamicProps) {
  // Local UI state for open/closed parents
  const [open, setOpen] = useState<Record<string, boolean>>({});
  // Local data state for asynchronously loaded children
  const [loadedChildren, setLoadedChildren] = useState<Record<string, SidebarOption[]>>({});

  // 1. Merge static children map with dynamically loaded children
  const allChildren = useMemo(
    () => ({ ...(childrenMap ?? {}), ...loadedChildren }),
    [childrenMap, loadedChildren]
  );

  const selectedParentSet = useMemo(() => new Set(selected.parent_cv_ids ?? []), [selected.parent_cv_ids]);
  const selectedChildSet = useMemo(() => new Set(selected.children ?? []), [selected.children]);

  // 2. Derived State: Calculate the status of every parent based on current selection props
  const parentStatus = useMemo(() => {
    const status: Record<string, { checked: boolean; indeterminate: boolean }> = {};

    parents.forEach((p) => {
      const pChildren = allChildren[p.id] ?? [];
      const childIds = pChildren.map((c) => c.id);

      if (childIds.length > 0) {
        // If children exist, parent status depends on them
        const allSelected = childIds.every((id) => selectedChildSet.has(id));
        const someSelected = childIds.some((id) => selectedChildSet.has(id));
        
        status[p.id] = {
          checked: allSelected,
          indeterminate: !allSelected && someSelected,
        };
      } else {
        // If no children (or not loaded yet), rely on explicit parent selection
        const isSelected = selectedParentSet.has(p.id);
        status[p.id] = { checked: isSelected, indeterminate: false };
      }
    });
    return status;
  }, [parents, allChildren, selectedChildSet, selectedParentSet]);

  // 3. Global Stats
  const globalStats = useMemo(() => {
    const allStats = Object.values(parentStatus);
    const allChecked = allStats.length > 0 && allStats.every((s) => s.checked);
    const someChecked = allStats.some((s) => s.checked || s.indeterminate);

    // Calculate total count for the "All Types" badge
    let totalCount = 0;
    parents.forEach(p => {
        const kids = allChildren[p.id] ?? [];
        
        // If p.count is undefined, fall back to the loaded children length.
        if (typeof p.count === 'number') {
           totalCount += p.count;
        } else if (p.hasChildren || kids.length > 0) {
           totalCount += kids.length;
        } else {
           // It's a leaf node parent, count it as 1
           totalCount += 1;
        }
    });

    return {
      checked: allChecked,
      indeterminate: !allChecked && someChecked,
      totalCount
    };
  }, [parentStatus, parents, allChildren]);

  // --- Handlers ---

  const handleToggleAll = () => {
    if (!globalStats.checked) {
      // Select All
      const allPIds = parents.map((p) => p.id);
      const allCIds = Object.values(allChildren).flat().map((c) => c.id);
      onChange({ parent_cv_ids: allPIds, children: allCIds });
    } else {
      // Deselect All
      onChange({ parent_cv_ids: [], children: [] });
    }
  };

  const handleToggleParent = (parentId: string) => {
    const currentStatus = parentStatus[parentId];
    const shouldSelect = !currentStatus.checked; // If indeterminate, we also want to select all
    
    const children = allChildren[parentId] ?? [];
    const nextParentSet = new Set(selectedParentSet);
    const nextChildSet = new Set(selectedChildSet);

    if (shouldSelect) {
      nextParentSet.add(parentId);
      children.forEach((c) => nextChildSet.add(c.id));
    } else {
      nextParentSet.delete(parentId);
      children.forEach((c) => nextChildSet.delete(c.id));
    }

    onChange({
      parent_cv_ids: Array.from(nextParentSet),
      children: Array.from(nextChildSet),
    });
  };

  const handleToggleChild = (childId: string) => {
    const nextChildSet = new Set(selectedChildSet);
    if (nextChildSet.has(childId)) nextChildSet.delete(childId);
    else nextChildSet.add(childId);

    onChange({
      ...selected,
      children: Array.from(nextChildSet),
    });
  };

  const handleToggleOpen = async (parentId: string, hasChildren?: boolean) => {
    const nextOpenState = !open[parentId];
    setOpen((prev) => ({ ...prev, [parentId]: nextOpenState }));

    // Dynamic Load Logic
    if (nextOpenState && hasChildren && !allChildren[parentId] && loadChildren) {
      try {
        const loaded = await loadChildren(parentId);
        // Using functional update to ensure we don't overwrite concurrent loads
        setLoadedChildren((prev) => ({ ...prev, [parentId]: Array.isArray(loaded) ? loaded : [] }));

        // Edge Case: If the parent was ALREADY selected (checked) when we opened it,
        // we must select the newly loaded children to maintain logic consistency.
        if (parentStatus[parentId]?.checked && Array.isArray(loaded) && loaded.length > 0) {
          const nextChildSet = new Set(selected.children ?? []);
          loaded.forEach(c => nextChildSet.add(c.id));
          onChange({ ...selected, children: Array.from(nextChildSet) });
        }
      } catch (err) {
        console.error("Failed to load children for", parentId, err);
      }
    }
  };

  if (!parents.length) {
    return (
      <div aria-label={title}>
        <div className="text-muted" style={{ fontSize: "0.9em" }}>
          (No filters available yet)
        </div>
      </div>
    );
  }

  return (
    <div aria-label={title}>
      {/* Header / Select All */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center">
          <input
            id="cv-select-all"
            type="checkbox"
            className="me-2"
            checked={globalStats.checked}
            ref={(el) => {
              if (el) el.indeterminate = globalStats.indeterminate;
            }}
            onChange={handleToggleAll}
          />
          <label htmlFor="cv-select-all" className="m-0">All Types</label>
          <span className="badge bg-light text-secondary ms-2">{globalStats.totalCount}</span>
        </div>
      </div>
      
      <hr className="my-2" />

      {/* List of Parents */}
      <ul className="list-unstyled m-0">
        {parents.map((p) => {
          const children = allChildren[p.id] ?? [];
          const isExpandable = p.hasChildren || children.length > 0;
          const isOpen = !!open[p.id];
          const status = parentStatus[p.id] || { checked: false, indeterminate: false };
          
          let countDisplay = 1;
          if (typeof p.count === 'number') {
            countDisplay = p.count;
          } else if (isExpandable) {
            countDisplay = children.length;
          }

          return (
            <li key={p.id} className="py-1">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <input
                    id={`cv-${p.id}`}
                    type="checkbox"
                    className="me-2"
                    checked={status.checked}
                    ref={(el) => {
                      if (el) el.indeterminate = status.indeterminate;
                    }}
                    onChange={() => handleToggleParent(p.id)}
                  />
                 <label htmlFor={`cv-${p.id}`} className="m-0">{p.label}</label>
                 {/* Only show badge if count > 0 or if you want to show 0 explicitly */}
                 {countDisplay > 0 && <span className="badge bg-light text-secondary ms-2">{countDisplay}</span>}
                </div>

                {isExpandable && (
                  <button
                    type="button"
                    className="btn btn-sm p-0 border-0 bg-transparent ms-2"
                    onClick={() => handleToggleOpen(p.id, p.hasChildren)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                )}
              </div>

              {/* Children List */}
              {isOpen && children.length > 0 && (
                <div className="ms-4 mt-1">
                  <ul className="list-unstyled m-0 small">
                    {children.map((c) => {
                      const isChecked = selectedChildSet.has(c.id);
                      return (
                        <li key={c.id} className="d-flex align-items-center justify-content-between py-1">
                          <div className="d-flex align-items-center">
                            <input
                              id={`cv-child-${c.id}`}
                              type="checkbox"
                              className="me-2"
                              checked={isChecked}
                              onChange={() => handleToggleChild(c.id)}
                            />
                            <label htmlFor={`cv-child-${c.id}`} className="m-0">{c.label}</label>
                            {typeof c.count === "number" && (
                              <span className="badge bg-light text-secondary ms-2">{c.count}</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}