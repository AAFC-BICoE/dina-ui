// FiqlSearchFilterBuilder.ts
// A chainable FIQL builder modeled after SimpleSearchFilterBuilder,
// focused on producing root-level, parenthesized groups joined by AND (;).
// Also supports OR (,) within a single group via `.or(...)`.

export type FiqlOperation =
  | "EQ" // selector==value
  | "NEQ" // selector!=value
  | "GE" // selector=ge=value
  | "LE" // selector=le=value
  | "GT" // selector=gt=value
  | "LT" // selector=lt=value
  | "IN" // selector=in=a,b,c
  | "CONTAINS"; // selector==*value*

// Conservative escaping for FIQL control chars. Adjust if your API expects different escaping.
const escapeValue = (v: string | number | boolean) =>
  String(v).replace(/([,;()])/g, "\\$1");

/**
 * Builds a single FIQL comparison fragment (unparenthesized), e.g. `name==foo`.
 * Returns null if the value should be skipped (null/undefined/empty array).
 * Shared by both the top-level AND builder and the OR sub-builder so their
 * comparison semantics never drift apart.
 */
function buildFragment(
  selector: string,
  op: FiqlOperation,
  value: string | number | boolean | Array<string | number | boolean>
): string | null {
  if (
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return null;
  }

  switch (op) {
    case "EQ":
      return `${selector}==${escapeValue(value as string | number | boolean)}`;

    case "NEQ":
      return `${selector}!=${escapeValue(value as string | number | boolean)}`;

    case "IN": {
      const arr = Array.isArray(value) ? value : [value];
      return `${selector}=in=${arr.map(escapeValue).join(",")}`;
    }

    case "CONTAINS": {
      const term = String(value).replace(/\*/g, "\\*");
      return `${selector}==*${term}*`;
    }

    case "GE":
    case "LE":
    case "GT":
    case "LT": {
      const map: Record<
        Exclude<FiqlOperation, "EQ" | "NEQ" | "IN" | "CONTAINS">,
        string
      > = {
        GE: "=ge=",
        LE: "=le=",
        GT: "=gt=",
        LT: "=lt="
      } as const;
      return `${selector}${map[op]}${escapeValue(
        value as string | number | boolean
      )}`;
    }

    default:
      return null;
  }
}

/**
 * Sub-builder used inside `.or(...)`. Collects comparison fragments joined by
 * comma (FIQL OR) instead of the semicolon (AND) used at the top level.
 * Mirrors the helpers (`whereProvided`, `contains`, `whereIn`, `when`)
 * from the top-level builder.
 */
export class FiqlOrGroupBuilder {
  private fragments: string[] = [];

  public where(
    selector: string,
    op: FiqlOperation,
    value: string | number | boolean | Array<string | number | boolean>
  ): this {
    const fragment = buildFragment(selector, op, value);
    if (fragment) this.fragments.push(fragment);
    return this;
  }

  public whereProvided(
    selector: string,
    op: FiqlOperation,
    value?: string | number | boolean | Array<string | number | boolean> | null
  ): this {
    if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return this;
    }
    return this.where(selector, op, value as any);
  }

  public contains(selector: string, term?: string): this {
    if (!term?.trim()) return this;
    return this.where(selector, "CONTAINS", term);
  }

  public whereIn(
    selector: string,
    values?: Array<string | number | boolean>
  ): this {
    if (!values || values.length === 0) return this;
    return this.where(selector, "IN", values);
  }

  /** Merge a raw FIQL fragment (unparenthesized) as one OR-ed term. */
  public raw(fragment: string | null | undefined): this {
    const f = (fragment ?? "").trim();
    if (!f) return this;
    this.fragments.push(f);
    return this;
  }

  public when(
    condition: boolean,
    apply: (b: this) => void,
    otherwise?: (b: this) => void
  ): this {
    if (condition) apply(this);
    else if (otherwise) otherwise(this);
    return this;
  }

  /** Produce the OR-joined, unparenthesized fragment list: f1,f2,f3 */
  public build(): string {
    return this.fragments.filter(Boolean).join(",");
  }
}

/**
 * Chainable FIQL builder that emits: (group1);(group2);(group3)
 * Each `where*` call becomes a single top-level parenthesized group (AND).
 * `.or(...)` builds one top-level group whose internal terms are OR-ed (,).
 */
export class FiqlSearchFilterBuilder {
  private groups: string[] = [];

  private constructor() {}

  /** Factory */
  public static create(): FiqlSearchFilterBuilder {
    return new FiqlSearchFilterBuilder();
  }

  /** Merge a raw FIQL fragment as its own top-level group. */
  public group(rawFiql: string | null | undefined): this {
    const f = (rawFiql ?? "").trim();
    if (!f) return this;
    this.groups.push(f.startsWith("(") ? f : `(${f})`);
    return this;
  }

  /**
   * Generic where with explicit op.
   * - EQ: selector==value
   * - NEQ: selector!=value
   * - IN: selector=in=a,b
   * - GE/LE/GT/LT: selector=op=value (lowercase fiql operator)
   * - CONTAINS: selector==*value*
   */
  public where(
    selector: string,
    op: FiqlOperation,
    value: string | number | boolean | Array<string | number | boolean>
  ): this {
    const fragment = buildFragment(selector, op, value);
    if (!fragment) return this;

    // Each where call contributes one top-level group
    this.groups.push(`(${fragment})`);
    return this;
  }

  /** Convenience: only add the condition if provided (not null/undefined/empty-string/empty-array). */
  public whereProvided(
    selector: string,
    op: FiqlOperation,
    value?: string | number | boolean | Array<string | number | boolean> | null
  ): this {
    if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return this;
    }
    return this.where(selector, op, value as any);
  }

  /** Free-text contains helper (field==*term*) */
  public contains(selector: string, term?: string): this {
    if (!term?.trim()) return this;
    return this.where(selector, "CONTAINS", term);
  }

  /** IN helper (field=in=a,b) */
  public whereIn(
    selector: string,
    values?: Array<string | number | boolean>
  ): this {
    if (!values || values.length === 0) return this;
    return this.where(selector, "IN", values);
  }

  /**
   * OR helper: builds a single top-level group whose terms are OR-ed together.
   *   .or(b => b.where("a", "EQ", "1").where("b", "EQ", "2"))
   * produces the group: (a==1,b==2)
   * An empty OR group (all terms skipped/filtered) contributes nothing.
   */
  public or(build: (b: FiqlOrGroupBuilder) => void): this {
    const orBuilder = new FiqlOrGroupBuilder();
    build(orBuilder);
    const inner = orBuilder.build();
    if (!inner) return this;
    this.groups.push(`(${inner})`);
    return this;
  }

  /** Conditional application, like your SimpleSearchFilterBuilder.when(...) */
  public when(
    condition: boolean,
    apply: (b: this) => void,
    otherwise?: (b: this) => void
  ): this {
    if (condition) apply(this);
    else if (otherwise) otherwise(this);
    return this;
  }

  /** Produce the final FIQL string: (g1);(g2);(g3) */
  public build(): string {
    return this.groups.filter(Boolean).join(";");
  }
}
