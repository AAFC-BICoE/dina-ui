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
   * Adds a filter with a specific operation (LIKE, ILIKE, GT, etc.).
   * e.g., .where('age', 'GT', 18) results in { age: { GT: 18 } }
   *
   * @param key The field to filter on.
   * @param op The comparison operator.
   * @param value The value for the comparison.
   */
  public where<K extends keyof T>(
    field: K | "uuid",
    op: FilterOperation,
    value: T[K]
  ): this {
    this.filter[String(field)] = { [op]: value } as any;
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
