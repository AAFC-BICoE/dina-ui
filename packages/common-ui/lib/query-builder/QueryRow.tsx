interface QueryRowProps {
  esIndexMapping: ESIndexMapping;
}

export interface ESIndexMapping {
  name: string;
  label: string;
  type: string;
}
