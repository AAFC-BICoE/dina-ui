export interface PersonIdentifierAttributes {
  type: "identifier";
  id?: string | undefined;
  createdBy?: string;
  createdOn?: string;
  namespace?: string;
  value?: string;
}

export type Identifier = PersonIdentifierAttributes;
