// FiqlSearchFilterBuilder.ts
// A chainable FIQL builder modeled after SimpleSearchFilterBuilder,
// focused on producing root-level, parenthesized groups joined by AND (;).

export type FiqlOperation =
  | "EQ"     // selector==value
  | "NEQ"    // selector!=value
  | "GE"     // selector=ge=value
  | "LE"     // selector=le=value
  | "GT"     // selector=gt=value
  | "LT"     // selector=lt=value
  | "IN"     // selector=in=a,b,c
  | "CONTAINS"; // selector==*value*

// Conservative escaping for FIQL control chars. Adjust if your API expects different escaping.
const escapeValue = (v: string | number | boolean) =>
  String(v).replace(/([,;()])/g, "\\$1");

/**
 * Chainable FIQL builder that emits: (group1);(group2);(group3)
 * Each `where*` call becomes a single top-level parenthesized group.
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
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      return this;
    }

    let fragment: string;

    switch (op) {
      case "EQ":
        fragment = `${selector}==${escapeValue(value as string | number | boolean)}`;
        break;

      case "NEQ":
        fragment = `${selector}!=${escapeValue(value as string | number | boolean)}`;
        break;

      case "IN": {
        const arr = Array.isArray(value) ? value : [value];
        fragment = `${selector}=in=${arr.map(escapeValue).join(",")}`;
        break;
      }

      case "CONTAINS": {
        const term = String(value).replace(/\*/g, "\\*");
        fragment = `${selector}==*${term}*`;
        break;
      }

      case "GE":
      case "LE":
      case "GT":
      case "LT": {
        const map: Record<Exclude<FiqlOperation, "EQ"|"NEQ"|"IN"|"CONTAINS">, string> = {
          GE: "=ge=",
          LE: "=le=",
          GT: "=gt=",
          LT: "=lt="
        } as const;
        fragment = `${selector}${map[op]}${escapeValue(value as string | number | boolean)}`;
        break;
      }

      default:
        // Should not happen, but keep TS satisfied.
        return this;
    }

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
  public whereIn(selector: string, values?: Array<string | number | boolean>): this {
    if (!values || values.length === 0) return this;
    return this.where(selector, "IN", values);
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