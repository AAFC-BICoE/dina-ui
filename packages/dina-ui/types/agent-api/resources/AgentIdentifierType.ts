import { MultilingualTitle } from "../../common";

export interface AgentIdentifierTypeAttributes {
  type: "identifier-type";
  id?: string | undefined;
  group?: string;
  createdBy?: string;
  createdOn?: string;
  key?: string;
  name?: string;
  dinaComponents?: string[];
  uriTemplate?: string;
  term?: string;
  multilingualTitle?: MultilingualTitle;
  isCompleted?: boolean;
}

export type AgentIdentifierType = AgentIdentifierTypeAttributes;
