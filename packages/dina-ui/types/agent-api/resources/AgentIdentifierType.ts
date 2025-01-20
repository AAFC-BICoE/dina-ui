import { MultilingualTitle } from "../../common";

export interface AgentIdentifierTypeAttributes {
  type: "identifier-type";
  id?: string | undefined;
  createdBy?: string;
  createdOn?: string;
  key?: string;
  name?: string;
  dinaComponents?: string[];
  uriTemplate?: string;
  term?: string;
  multilingualTitle?: MultilingualTitle;
}

export type AgentIdentifierType = AgentIdentifierTypeAttributes;
