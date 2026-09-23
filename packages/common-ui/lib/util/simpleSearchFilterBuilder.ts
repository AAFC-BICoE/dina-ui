import { FilterParam } from "kitsu";
import { ScopeOption } from "../resource-select/ResourceScopes";

/**
 * Supported filter operations matching the back-end "simple filter" operator names.
 *
 * `NOT_ILIKE` is the exception. It lacks a simple-filter equivalent and exists to support
 * "IS NOT partial match" in the UI. `simpleSearchFilterToFiql` makes it a negated wildcard match.
 * `simpleSearchFilterToQueryString` passes it unchanged for the server to intercept.
 */
export type FilterOperation =
  | "EQ"
  | "NEQ"
  | "GT"
  | "GOE"
  | "LT"
  | "LOE"
  | "LIKE"
  | "ILIKE"
  | "NOT_ILIKE"
  | "IN";

/** Key holding the members of an OR group inside a {@link SimpleSearchFilter}. */
export const OR_KEY = "$or";

/** Key holding extra AND-ed members inside a {@link SimpleSearchFilter}. */
export const AND_KEY = "$and";

export type SimpleSearchFilterValue = string | number | boolean | null;

/**
 * Operations applied to a field (e.g. `{ GOE: 1, LOE: 5 }`). Array values are serialized
 * by kitsu. The builder joins `IN` lists into a comma-separated string.
 */
export type SimpleSearchFilterCondition = {
  [op in FilterOperation]?: SimpleSearchFilterValue | SimpleSearchFilterValue[];
};

/**
 * The object produced by {@link SimpleSearchFilterBuilder}.
 *
 * - Field keys are conditions that are AND-ed together.
 * - `$or` holds sub-filters that are OR-ed together.
 * - `$and` holds sub-filters AND-ed with the rest of the object. Used when conditions
 *   cannot be merged (e.g. multiple OR groups or repeating a field and operator).
 * - A field can hold a plain value (`{ name: "abc" }`), treated as equality. Prefer `{ name: { EQ: "abc" } }`.
 *
 * The plain shape is serialized by kitsu to `filter[field][OP]=value`.
 */
export interface SimpleSearchFilter {
  [field: string]:
    | SimpleSearchFilterCondition
    | SimpleSearchFilter[]
    | SimpleSearchFilterValue
    | SimpleSearchFilterValue[]
    | undefined;
  $or?: SimpleSearchFilter[];
  $and?: SimpleSearchFilter[];
}

export type SimpleSearchFilterOperator = "AND" | "OR";

/** True for an `IN` whose list is empty, in either the array or the comma-separated form. */
export function isEmptyInList(op: string, value: unknown): boolean {
  return (
    op === "IN" &&
    (value === "" || (Array.isArray(value) && value.length === 0))
  );
}

/**
 * Returns true if the filter has no conditions. Blank plain values (`{ name: "" }`)
 * and empty `IN` lists do not count as conditions.
 */
export function isEmptySimpleSearchFilter(
  filter: SimpleSearchFilter | FilterParam | null | undefined
): boolean {
  if (!filter || typeof filter !== "object") {
    return true;
  }
  return Object.entries(filter).every(([key, value]) => {
    if (value === undefined) {
      return true;
    }
    if (key === OR_KEY || key === AND_KEY) {
      return (
        !Array.isArray(value) ||
        (value as SimpleSearchFilter[]).every(isEmptySimpleSearchFilter)
      );
    }
    if (value === null || typeof value !== "object") {
      return value === "";
    }
    return Object.entries(value).every(
      ([op, opValue]) => opValue === undefined || isEmptyInList(op, opValue)
    );
  });
}

/**
 * Merges two filters so both must match (AND). Inputs are not mutated.
 *
 * - Conditions on different fields or different operators on the same field are merged.
 * - A second OR group or a repeated field and operator are added to `$and`.
 * - Identical conditions are kept once.
 */
export function mergeSimpleSearchFilters(
  target: SimpleSearchFilter,
  source: SimpleSearchFilter
): SimpleSearchFilter {
  const result: SimpleSearchFilter = {};
  // Fields can be named anything including "__proto__". Use defineProperty to avoid
  // triggering Object.prototype setters when storing conditions.
  const setField = (field: string, fieldValue: SimpleSearchFilter[string]) =>
    Object.defineProperty(result, field, {
      value: fieldValue,
      enumerable: true,
      writable: true,
      configurable: true
    });

  for (const [key, value] of Object.entries(target)) {
    setField(key, value);
  }

  const appendAnd = (...members: SimpleSearchFilter[]) => {
    setField(AND_KEY, [
      ...((result[AND_KEY] as SimpleSearchFilter[]) ?? []),
      ...members
    ]);
  };

  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) {
      continue;
    }

    if (key === AND_KEY) {
      appendAnd(...(value as SimpleSearchFilter[]));
      continue;
    }

    if (key === OR_KEY) {
      const members = value as SimpleSearchFilter[];
      if (!result[OR_KEY]) {
        // Copied so that mutating the result can't reach back into the caller's filter:
        setField(OR_KEY, [...members]);
      } else {
        appendAnd({ [OR_KEY]: [...members] });
      }
      continue;
    }

    const existing = result[key];

    // Plain values are kept as is. Blank values are not conditions. Null values
    // are conditions that search for blank fields.
    if (value === null || typeof value !== "object") {
      if (value === "") {
        continue;
      }
      if (existing === undefined) {
        setField(key, value);
      } else if (existing !== value) {
        appendAnd({ [key]: value });
      }
      continue;
    }

    const condition = value as SimpleSearchFilterCondition;
    if (existing === undefined) {
      setField(key, { ...condition });
      continue;
    }
    if (existing === null || typeof existing !== "object") {
      appendAnd({ [key]: condition });
      continue;
    }

    const merged: SimpleSearchFilterCondition = {
      ...(existing as SimpleSearchFilterCondition)
    };
    for (const [op, opValue] of Object.entries(condition) as [
      FilterOperation,
      SimpleSearchFilterValue | undefined
    ][]) {
      if (opValue === undefined) {
        continue;
      }
      if (merged[op] === undefined) {
        merged[op] = opValue;
      } else if (merged[op] !== opValue) {
        appendAnd({ [key]: { [op]: opValue } });
      }
    }
    setField(key, merged);
  }

  return result;
}

/**
 * Generates kitsu compatible filter conditions.
 *
 * Each builder method adds a condition. The default (AND) builder requires all conditions to match.
 * Inside an `.or(...)` callback, any condition can match.
 */
export class SimpleSearchFilterBuilder<T extends Record<string, any>> {
  private readonly conditions: SimpleSearchFilter[] = [];

  private constructor(
    private readonly operator: SimpleSearchFilterOperator = "AND"
  ) {}

  /**
   * Creates a new instance of the FilterBuilder.
   *
   * @returns A new FilterBuilder instance.
   */
  public static create<
    T extends Record<string, any>
  >(): SimpleSearchFilterBuilder<T> {
    return new SimpleSearchFilterBuilder<T>("AND");
  }

  /**
   * Adds pre-built filter conditions directly to the current filter.
   * Useful for merging existing FilterParam objects or reusing common filter patterns.
   * Empty and non-object filters are ignored.
   *
   * @param filterParam The filter to merge.
   * @returns The updated builder instance.
   */
  public add(
    filterParam: FilterParam | SimpleSearchFilter | null | undefined
  ): this {
    if (typeof filterParam === "string") {
      // Raw FIQL strings cannot be merged. Silently dropping them widens the query to all records.
      console.error(
        `SimpleSearchFilterBuilder.add() ignored a string filter ("${filterParam}"). ` +
          `Build the filter with SimpleSearchFilterBuilder instead of writing FIQL.`
      );
      return this;
    }
    if (!isEmptySimpleSearchFilter(filterParam)) {
      this.conditions.push(filterParam as SimpleSearchFilter);
    }
    return this;
  }

  /**
   * Adds a filter with a specific operation (e.g. .where('age', 'GT', 18)).
   * Throws if the value is undefined. Use .whereProvided() to ignore undefined values.
   * A null value searches for blank fields.
   *
   * @param field The field to filter on.
   * @param op The comparison operator.
   * @param value The value for the comparison.
   */
  public where<K extends keyof T>(
    field: K | "uuid",
    op: FilterOperation,
    value: T[K] | T[K][] | null
  ): this {
    if (value === undefined) {
      throw new Error(
        `Where condition value undefined for field: ${String(field)}`
      );
    }

    let conditionValue = value as
      | SimpleSearchFilterValue
      | SimpleSearchFilterValue[];

    if (op === "IN" && Array.isArray(value)) {
      // Empty lists add no conditions to prevent matching only blank values.
      if (value.length === 0) {
        return this;
      }

      // IN values are comma-separated. Lists containing commas are converted to an OR of equalities
      // so each value is escaped individually.
      if (
        value.some((item) => typeof item === "string" && item.includes(","))
      ) {
        return this.or((builder) => {
          value.forEach((item) => builder.where(field, "EQ", item));
        });
      }

      conditionValue = value.join(",");
    }

    this.conditions.push({
      [String(field)]: { [op]: conditionValue }
    } as SimpleSearchFilter);

    return this;
  }

  /**
   * Adds a filter only if the value is truthy (not null, undefined, or empty).
   *
   * @param field The field to filter on.
   * @param op The comparison operator.
   * @param value The value for the comparison.
   */
  public whereProvided<K extends keyof T>(
    field: K | "uuid",
    op: FilterOperation,
    value: T[K] | T[K][] | undefined | null
  ): this {
    // Skip null, undefined, empty strings, and empty lists for optional form inputs.
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      this.where(field, op, value);
    }
    return this;
  }

  /**
   * Adds a filter for a specific field using the IN operator.
   *
   * An undefined or empty list adds no filter, so the field is left unrestricted.
   *
   * @param field The field to filter on.
   * @param values The array of values to include in the filter.
   * @returns The updated FilterBuilder instance.
   */
  public whereIn<K extends keyof T>(
    field: K | "uuid",
    values?: Array<T[K] | string>
  ): this {
    if (values && values.length) {
      this.where(field, "IN", values as T[K][]);
    }
    return this;
  }

  /**
   * Generates a search filter.
   * e.g. .searchFilter('name', 'test') results in { name: { ILIKE: "%test%" }}
   */
  public searchFilter<K extends keyof T>(
    field: K | "uuid",
    value: string
  ): this {
    // Do not include the search filter if nothing is being searched on.
    if (!value) {
      return this;
    }

    this.where(field, "ILIKE", `%${value}%` as T[K]);
    return this;
  }

  /**
   * Adds a filter only if a condition is met.
   *
   * @param condition The boolean condition.
   * @param trueCallback Callback applied if the condition is true.
   * @param falseCallback Optional callback applied if the condition is false.
   */
  public when(
    condition: boolean,
    trueCallback: (builder: this) => void,
    falseCallback?: (builder: this) => void
  ): this {
    if (condition) {
      trueCallback(this);
    } else if (falseCallback) {
      falseCallback(this);
    }
    return this;
  }

  /**
   * Adds a group of OR conditions.
   * Each condition in the callback is an OR member.
   *
   * Use `.and(...)` inside the callback for members needing multiple conditions.
   * Empty groups add nothing. Single-condition groups add just that condition.
   *
   * @param callback Receives a builder for OR conditions.
   */
  public or(callback: (builder: SimpleSearchFilterBuilder<T>) => void): this {
    return this.group("OR", callback);
  }

  /**
   * Adds a group of AND conditions.
   * Useful inside `.or(...)` to combine multiple conditions into one OR member.
   *
   * @param callback Receives a builder for AND conditions.
   */
  public and(callback: (builder: SimpleSearchFilterBuilder<T>) => void): this {
    return this.group("AND", callback);
  }

  private group(
    operator: SimpleSearchFilterOperator,
    callback: (builder: SimpleSearchFilterBuilder<T>) => void
  ): this {
    const groupBuilder = new SimpleSearchFilterBuilder<T>(operator);
    callback(groupBuilder);
    return this.add(groupBuilder.build());
  }

  /**
   * Applies the active `applyFilter` for each scope.
   * Scopes without an active option are skipped.
   * Used by ResourceSelect to apply filters based on dropdown choices.
   *
   * @param scopes The scope definitions.
   * @param activeScopes Map of scopeId to the selected optionId.
   */
  public applyScopes(
    scopes: ScopeOption[] | undefined,
    activeScopes: Record<string, string> | undefined
  ): this {
    if (!scopes?.length || !activeScopes) {
      return this;
    }

    scopes.forEach((scope) => {
      if (scope.type === "toggle") {
        const activeOptionId = activeScopes[scope.id];
        const activeOption = scope.options.find(
          (opt) => opt.id === activeOptionId
        );
        activeOption?.applyFilter(this);
      }
    });

    return this;
  }

  /**
   * Returns the final, constructed filter object.
   *
   * @returns The filter object.
   */
  public build(): SimpleSearchFilter {
    const members = this.conditions.filter(
      (condition) => !isEmptySimpleSearchFilter(condition)
    );

    if (this.operator === "OR") {
      if (members.length === 0) {
        return {};
      }
      if (members.length === 1) {
        return { ...members[0] };
      }
      // Copied so that mutating the result can't reach back into this builder:
      return { [OR_KEY]: [...members] };
    }

    return members.reduce(mergeSimpleSearchFilters, {});
  }
}
