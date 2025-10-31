import { FilterParam } from "kitsu";

// Define the supported filter operations
export type FilterOperation =
  | "EQ"
  | "NEQ"
  | "GT"
  | "LT"
  | "LIKE"
  | "ILIKE"
  | "IN";

/**
 * Used to generate kitsu compatable filter conditions.
 *
 * This utility class was AI assisted and altered to help clean up how filters are generated.
 */
export class SimpleSearchFilterBuilder<T extends Record<string, any>> {
  private filter: FilterParam = {};

  private constructor() {}

  /**
   * Creates a new instance of the FilterBuilder.
   *
   * @returns A new FilterBuilder instance.
   */
  public static create<
    T extends Record<string, any>
  >(): SimpleSearchFilterBuilder<T> {
    return new SimpleSearchFilterBuilder<T>();
  }

  /**
   * Adds pre-built filter conditions directly to the current filter.
   * This is useful when you have existing FilterParam objects that need to be merged
   * into the current filter being built, such as when filters are constructed elsewhere
   * or when reusing common filter patterns.
   *
   * @param filterParam The FilterParam object to merge into the current filter.
   * @returns The updated FilterBuilder instance for method chaining.
   */
  public add(filterParam: FilterParam): this {
    if (filterParam && typeof filterParam === "object") {
      Object.assign(this.filter, filterParam);
    }
    return this;
  }

  /**
   * Adds a filter with a specific operation (LIKE, ILIKE, GT, etc.).
   * e.g., .where('age', 'GT', 18) results in { age: { GT: 18 } }
   *
   * If value is undefined, an error will be reported. Use .whereProvided() instead to determine
   * if the filter should be ignored.
   *
   * @param key The field to filter on.
   * @param op The comparison operator.
   * @param value The value for the comparison.
   */
  public where<K extends keyof T>(
    field: K | "uuid",
    op: FilterOperation,
    value: T[K] | T[K][]
  ): this {
    if (value === undefined) {
      throw new Error(
        `Where condition value undefined for field: ${String(field)}`
      );
    }

    if (op === "IN" && Array.isArray(value)) {
      this.filter[String(field)] = { [op]: value.join(",") } as any;
    } else {
      this.filter[String(field)] = { [op]: value } as any;
    }

    return this;
  }

  /**
   * Adds a filter only if the provided value is truthy.
   * This is a convenience method to simplify the common pattern of:
   * .when(value, builder => builder.where(field, op, value))
   *
   * A value is considered "truthy" if it is not null, undefined, or an empty string.
   *
   * @param field The field to filter on.
   * @param op The comparison operator.
   * @param value The value to check and use for the comparison.
   */
  public whereProvided<K extends keyof T>(
    field: K | "uuid",
    op: FilterOperation,
    value: T[K] | T[K][] | undefined | null
  ): this {
    // Check for null, undefined, or empty string.
    // This is a common requirement for optional form inputs.
    if (value !== null && value !== undefined && value !== "") {
      this.where(field, op, value);
    }
    return this;
  }

  /**
   * Adds a filter for a specific field using the IN operator.
   *
   * If undefined or empty array, this filter is not provided.
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
      // Convert to comma-separated list:
      this.filter[String(field)] = { IN: values.join(",") } as any;
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

    this.filter[String(field)] = { ILIKE: `%${value}%` } as any;
    return this;
  }

  /**
   * Adds a filter only if a certain condition is met.
   *
   * @param condition The boolean condition to evaluate.
   * @param trueCallback A function that receives the builder and applies filters if the condition is true.
   * @param falseCallback (Optional) A function that applies filters if the condition is false.
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
   * Returns the final, constructed filter object.
   *
   * @returns The filter object.
   */
  public build(): FilterParam {
    return this.filter;
  }
}
