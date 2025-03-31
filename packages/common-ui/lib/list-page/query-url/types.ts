export interface SimpleQueryGroup {
  conj: string;
  props: SimpleQueryRow[];
}

export interface SimpleQueryRow {
  field: string;
  operator: string;
  value: string;
  type: string;
}
