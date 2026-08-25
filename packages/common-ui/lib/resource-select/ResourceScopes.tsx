import { components, MenuListProps } from "react-select";
import { SimpleSearchFilterBuilder } from "../util/simpleSearchFilterBuilder";
import _ from "lodash";

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

/**
 * Discriminated union for extendable scope types.
 * Future types (Like dropdownScope for example) can be added here to allow for different types.
 */
export type ScopeOption = ToggleScopeOption;

/**
 * Helper function to retrieve nested attributes from an object.
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Custom MenuList rendering sticky scope filter controls above options.
 */
export const ScopedMenuList = (props: MenuListProps<any, boolean>) => {
  const { scopes, activeScopes, onScopeChange } = props.selectProps as any;

  return (
    <components.MenuList {...props} className="">
      {scopes && scopes.length > 0 && (
        <div
          style={{
            padding: "12px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            position: "sticky",
            top: 0,
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}
        >
          {scopes.map((scope: ScopeOption) => {
            if (scope.type === "toggle") {
              return (
                <div
                  key={scope.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
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
                            padding: "6px 12px",
                            fontSize: "13px",
                            cursor: "pointer",
                            backgroundColor: isActive ? "#2563eb" : "#ffffff",
                            color: isActive ? "#ffffff" : "#475569",
                            border: "1px solid",
                            borderColor: isActive ? "#2563eb" : "#cbd5e1",
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
export const GROUP_SCOPE = (groupNames: string[]): ScopeOption => ({
  id: "groupFilter",
  type: "toggle",
  label: "Group",
  options: [
    {
      id: "myGroups",
      label: "My Groups",
      applyFilter: (builder) => {
        builder.whereIn("group", groupNames);
      }
    },
    {
      id: "allGroups",
      label: "All Groups",
      applyFilter: _.noop
    }
  ]
});
