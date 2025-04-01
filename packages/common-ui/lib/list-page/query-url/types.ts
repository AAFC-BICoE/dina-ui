export interface SimpleQueryGroup {
  // Conjunction (AND/OR)
  c: string;

  // Props: Items inside the group
  p: SimpleQueryRow[];
}

export interface SimpleQueryRow {
  // Field
  f: string;

  // Operator
  o: string;

  // Value
  v: string;

  // Type
  t: string;

  // Dynamic field identifier (UUID for example if managed attribute)
  d?: string;
}
