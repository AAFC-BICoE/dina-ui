import { components, MenuListProps } from "react-select";
import { SimpleSearchFilterBuilder } from "../util/simpleSearchFilterBuilder";
import _ from "lodash";
import { CSSProperties, useId, useLayoutEffect, useRef, useState } from "react";

/**
 * Definition for a Toggle scope option.
 * Only one option from the toggle can be selected. Can have more than options choices here.
 */
export interface ToggleScopeOption {
  /** Unique identifier for this scope. */
  id: string;

  /** Scope type. */
  type: "toggle";

  /** Optional label displayed above the toggle button group. */
  label?: string | React.JSX.Element;

  /** Toggle options to be displayed to the user. */
  options: {
    /**
     * Unique identifier for the option.
     */
    id: string;

    /**
     * Display label for the toggle option.
     */
    label: string | React.JSX.Element;

    /**
     * If the option is selected, you can use the filter builder to add what filter should be set.
     * @param builder SimpleSearchFilterBuilder, no need to .build() at the end.
     */
    applyFilter: (builder: SimpleSearchFilterBuilder<any>) => void;
  }[];
}

/** Extra information given to a scope's client-side option filter. */
export interface ScopeFilterContext {
  /** Whether the option is already part of the select's value. */
  isSelected: boolean;
}

/**
 * Definition for a Checkbox scope option.
 * The scope's filters are only applied while the checkbox is checked.
 */
export interface CheckboxScopeOption {
  /** Unique identifier for this scope. */
  id: string;

  /** Scope type. */
  type: "checkbox";

  /** Label displayed beside the checkbox. */
  label: string | React.JSX.Element;

  /** Whether the checkbox starts checked. Defaults to false. */
  defaultChecked?: boolean;

  /**
   * When checked, you can use the filter builder to add what filter should be set.
   * @param builder SimpleSearchFilterBuilder, no need to .build() at the end.
   */
  applyFilter?: (builder: SimpleSearchFilterBuilder<any>) => void;

  /**
   * When checked, filters the loaded options on the client side. Return false to hide the option.
   * Useful for filters the API can't do, like hiding the already selected options.
   */
  filterOption?: (resource: any, context: ScopeFilterContext) => boolean;
}

/**
 * Discriminated union for extendable scope types.
 * Future types (Like dropdownScope for example) can be added here to allow for different types.
 */
export type ScopeOption = ToggleScopeOption | CheckboxScopeOption;

/**
 * The current value of each scope, by scope id.
 * Toggle scopes hold the selected option id, checkbox scopes hold whether they're checked.
 */
export type ScopeValues = Record<string, string | boolean>;

/**
 * Returns the initial scope values, using the defaults when provided. Otherwise toggles use their
 * first option and checkboxes use their defaultChecked value.
 */
export function getInitialScopeValues(
  scopes: ScopeOption[] | undefined,
  defaultScopes: ScopeValues | undefined
): ScopeValues {
  const initialState: ScopeValues = { ...defaultScopes };
  scopes?.forEach((scope) => {
    if (initialState[scope.id] !== undefined) {
      return;
    }
    if (scope.type === "toggle" && scope.options.length > 0) {
      initialState[scope.id] = scope.options[0].id;
    } else if (scope.type === "checkbox") {
      initialState[scope.id] = scope.defaultChecked ?? false;
    }
  });
  return initialState;
}

/**
 * Returns false if any checked checkbox scope filters out the given resource on the client side.
 */
export function passesScopeOptionFilters(
  scopes: ScopeOption[] | undefined,
  activeScopes: ScopeValues | undefined,
  resource: any,
  context: ScopeFilterContext
): boolean {
  return !scopes?.some(
    (scope) =>
      scope.type === "checkbox" &&
      activeScopes?.[scope.id] === true &&
      scope.filterOption &&
      !scope.filterOption(resource, context)
  );
}

/**
 * Helper function to retrieve nested attributes from an object.
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

/** CSS variable holding the scope header height, used to offset sticky group headings. */
export const SCOPE_HEADER_HEIGHT_VAR = "--scope-header-height";

/**
 * Custom MenuList rendering sticky scope filter controls above options.
 */
export const ScopedMenuList = (props: MenuListProps<any, boolean>) => {
  const { scopes, activeScopes, onScopeChange } = props.selectProps as any;
  const headerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [headerHeight, setHeaderHeight] = useState(0);

  // Track the header height so group headings can stick just below it:
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) {
      setHeaderHeight(0);
      return;
    }
    setHeaderHeight(header.getBoundingClientRect().height);
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() =>
      setHeaderHeight(header.getBoundingClientRect().height)
    );
    observer.observe(header);
    return () => observer.disconnect();
  }, [scopes?.length]);

  return (
    <components.MenuList
      {...props}
      className=""
      innerProps={{
        ...props.innerProps,
        style: {
          ...props.innerProps?.style,
          // Overlap the header's bottom border by 1px so no gap shows above sticky group headings:
          [SCOPE_HEADER_HEIGHT_VAR]: `${Math.max(headerHeight - 1, 0)}px`
        } as CSSProperties
      }}
    >
      {scopes && scopes.length > 0 && (
        <div
          ref={headerRef}
          style={{
            padding: "6px 12px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            position: "sticky",
            top: 0,
            zIndex: 2,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px 16px"
          }}
        >
          {scopes.map((scope: ScopeOption) => {
            if (scope.type === "toggle") {
              return (
                <div
                  key={scope.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {scope.label && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      {scope.label}
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {scope.options.map((option, index) => {
                      const isActive = activeScopes[scope.id] === option.id;
                      const isFirst = index === 0;
                      const isLast = index === scope.options.length - 1;

                      return (
                        <div
                          key={option.id}
                          onClick={() => onScopeChange?.(scope.id, option.id)}
                          style={{
                            padding: "2px 10px",
                            fontSize: "12px",
                            cursor: "pointer",
                            backgroundColor: isActive ? "#335075" : "#ffffff",
                            color: isActive ? "#ffffff" : "#475569",
                            border: "1px solid",
                            borderColor: isActive ? "#335075" : "#cbd5e1",
                            borderTopLeftRadius: isFirst ? "4px" : "0",
                            borderBottomLeftRadius: isFirst ? "4px" : "0",
                            borderTopRightRadius: isLast ? "4px" : "0",
                            borderBottomRightRadius: isLast ? "4px" : "0",
                            marginLeft: isFirst ? "0" : "-1px",
                            fontWeight: 500,
                            zIndex: isActive ? 1 : 0,
                            position: "relative"
                          }}
                        >
                          {option.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            if (scope.type === "checkbox") {
              const isChecked = activeScopes[scope.id] === true;
              const labelId = `${menuId}-scope-${scope.id}`;
              return (
                <div
                  key={scope.id}
                  onClick={() => onScopeChange?.(scope.id, !isChecked)}
                  style={{
                    // Checkboxes sit on the right side of the scope bar:
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#475569",
                    fontWeight: 500,
                    cursor: "pointer",
                    userSelect: "none"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    aria-labelledby={labelId}
                    tabIndex={-1}
                    readOnly={true}
                    style={{
                      margin: 0,
                      cursor: "pointer",
                      accentColor: "#335075",
                      pointerEvents: "none"
                    }}
                  />
                  <span id={labelId}>{scope.label}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
      {props.children}
    </components.MenuList>
  );
};

//
// Commonly Used Scopes
//

/**
 * Simple Group Scope filter, adds a toggle to let you select from all groups or the groups you are
 * currently in.
 */
export const GROUP_SCOPE = (
  groupNames: string[],
  formatMessage: any
): ScopeOption => ({
  id: "groupFilter",
  type: "toggle",
  label: formatMessage({ id: "group" }),
  options: [
    {
      id: "myGroups",
      label: formatMessage({ id: "myGroups" }),
      applyFilter: (builder) => {
        builder.whereIn("group", groupNames);
      }
    },
    {
      id: "allGroups",
      label: formatMessage({ id: "allGroups" }),
      applyFilter: _.noop
    }
  ]
});

/**
 * Checkbox to hide the options that are already selected. When unchecked, use it with
 * ResourceSelect's `showSelectedOptions` prop so the selected options are displayed grayed out.
 */
export const HIDE_SELECTED_SCOPE = (formatMessage: any): ScopeOption => ({
  id: "hideSelected",
  type: "checkbox",
  label: formatMessage({ id: "hideSelectedOptions" }),
  filterOption: (_resource, { isSelected }) => !isSelected
});
