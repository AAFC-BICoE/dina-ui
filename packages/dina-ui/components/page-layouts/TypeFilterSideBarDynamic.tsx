import React, { useMemo, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";

export interface SidebarOption {
  id: string;
  label: string;
  count?: number;
  hasChildren?: boolean;
}

export interface TypeFilterState {
  /** Selected parent CV ids. */
  parent_cv_ids: string[];
  /** Selected child ids */
  children?: string[];
}

/** Props for dynamic + expandable behavior. */
export interface TypeFilterSideBarDynamicProps {
  /** The top-level options (Controlled Vocabularies). */
  parents: SidebarOption[];

  childrenMap?: Record<string, SidebarOption[]>;

  /**
   * Lazy loader for children.
   * Return children for a parent id (Promise allowed). Called once per parent on first expand.
   */
  loadChildren?: (parentId: string) => Promise<SidebarOption[] | SidebarOption[]> | SidebarOption[];

  /** Current selection + change handler */
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
  title = "Filters"
}: TypeFilterSideBarDynamicProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [loadedChildren, setLoadedChildren] = useState<Record<string, SidebarOption[]>>({});

  const allChildren = useMemo(() => ({ ...(childrenMap ?? {}), ...loadedChildren }), [childrenMap, loadedChildren]);


  /** ---------- Helpers for "All Types" coverage ---------- */
  const allParentIds = useMemo(() => parents.map(p => p.id), [parents]);
  const allKnownChildIds = useMemo(() => {
    const ids: string[] = [];
    for (const list of Object.values(allChildren)) {
      for (const c of list ?? []) ids.push(c.id);
    }
    return Array.from(new Set(ids));
  }, [allChildren]);

  // Is "All Types" fully selected against what's currently known?
  const allParentsSelected =
    allParentIds.length > 0 &&
    allParentIds.every(id => (selected.parent_cv_ids ?? []).includes(id));
  const allChildrenSelected =
    allKnownChildIds.length === 0 ||
    allKnownChildIds.every(id => (selected.children ?? []).includes(id));
  const allTypesChecked = allParentsSelected && allChildrenSelected;

  // Should "All Types" show indeterminate (partial) selection?
  const hasAnyParent = (selected.parent_cv_ids ?? []).length > 0;
  const hasAnyChild = (selected.children ?? []).length > 0;
  const allTypesIndeterminate =
    !allTypesChecked && (hasAnyParent || hasAnyChild);

  function toggleAllTypes() {
    if (!allTypesChecked) {
      // Select everything currently known
      onChange({
        ...selected,
        parent_cv_ids: [...allParentIds],
        children: [...allKnownChildIds]
      });
    } else {
      // Clear everything
      onChange({
        ...selected,
        parent_cv_ids: [],
        children: []
      });
    }
  }

  function toggleParentSelected(id: string) {
    const setParents = new Set(selected.parent_cv_ids ?? []);
    const isSelecting = !setParents.has(id);
    if (isSelecting) setParents.add(id);
    else setParents.delete(id);

    // Cascade to children that are already known (from props or previously lazy-loaded):
    const children = allChildren[id] ?? [];
    const childSet = new Set(selected.children ?? []);

    if (isSelecting) {
      // Add all child ids for this parent
      for (const c of children) childSet.add(c.id);
    } else {
      // Remove this parent's child ids
      for (const c of children) childSet.delete(c.id);
    }

    onChange({
      ...selected,
      parent_cv_ids: Array.from(setParents),
      children: Array.from(childSet)
    });
  }

  async function toggleOpen(id: string, hasChildren?: boolean) {
    const nextOpen = !open[id];
    setOpen((o) => ({ ...o, [id]: nextOpen }));

    if (nextOpen && hasChildren && !allChildren[id] && loadChildren) {
      const childList = await loadChildren(id);

      // Save loaded children
      setLoadedChildren((m) => ({ ...m, [id]: childList as SidebarOption[] }));

      // If parent is already selected, auto-select these children too:
      const parentSelected = (selected.parent_cv_ids ?? []).includes(id);
      if (parentSelected && childList?.length) {
        const childSet = new Set(selected.children ?? []);
        for (const c of childList) childSet.add(c.id);

        onChange({ ...selected, children: Array.from(childSet) });
       }
      // If "All Types" is active, ensure newly discovered children are also selected.
      if (allTypesChecked && childList?.length) {
        const childSet = new Set(selected.children ?? []);
        for (const c of childList) childSet.add(c.id);
        onChange({ ...selected, children: Array.from(childSet) });
      }
    }
  }
  

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
      {/* ---------- All Types control + divider ---------- */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center">
          <input
            id="cv-select-all"
            type="checkbox"
            className="me-2"
            checked={allTypesChecked}
            ref={(el) => {
              if (el) el.indeterminate = allTypesIndeterminate;
            }}
            onChange={toggleAllTypes}
          />
          <label htmlFor="cv-select-all" className="m-0">All Types</label>
        </div>
      </div>
      <hr className="my-2" />

      <ul className="list-unstyled m-0">
        {parents.map((p) => {
          const checked = (selected.parent_cv_ids ?? []).includes(p.id);
          const cid = `cv-${p.id}`;
          const isOpen = !!open[p.id];
          const children = allChildren[p.id] ?? [];
          const expandable = p.hasChildren || !!children.length;

          return (
            <li key={p.id} className="py-1">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <input
                    id={cid}
                    type="checkbox"
                    className="me-2"
                    checked={checked}
                    onChange={() => toggleParentSelected(p.id)}
                  />
                  <label htmlFor={cid} className="m-0">{p.label}</label>
                </div>

                {/* Chevron for expandable parents */}
                {expandable && (
                  <button
                    type="button"
                    className="btn btn-sm p-0 border-0 bg-transparent ms-2"
                    onClick={() => toggleOpen(p.id, p.hasChildren)}
                    aria-expanded={isOpen}
                    aria-controls={`children-${p.id}`}
                  >
                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                )}

                {typeof p.count === "number" && (
                  <span className="badge bg-light text-secondary ms-2">{p.count}</span>
                )}
              </div>

              {/* Children */}
              {isOpen && children.length > 0 && (
                <div id={`children-${p.id}`} className="ms-4 mt-1">
                  <ul className="list-unstyled m-0 small">
                    {children.map((c) => {
                      const childChecked = (selected.children ?? []).includes(c.id);
                      const ccid = `cv-child-${p.id}-${c.id}`;
                      return (
                        <li key={c.id} className="d-flex align-items-center justify-content-between py-1">
                          <div className="d-flex align-items-center">
                            <input
                              id={ccid}
                              type="checkbox"
                              className="me-2"
                              checked={childChecked}
                              onChange={() => {
                                const set = new Set(selected.children ?? []);
                                if (set.has(c.id)) set.delete(c.id);
                                else set.add(c.id);
                                onChange({ ...selected, children: Array.from(set) });
                              }}
                            />
                            <label htmlFor={ccid} className="m-0">{c.label}</label>
                          </div>
                          {typeof c.count === "number" && (
                            <span className="badge bg-light text-secondary">{c.count}</span>
                          )}
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