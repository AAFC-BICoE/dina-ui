export const AGENT_MODULE_TYPES = ["PERSON"] as const;
export type AgentModuleType = (typeof AGENT_MODULE_TYPES)[number];
export const AGENT_MODULE_TYPE_LABELS: Record<AgentModuleType, string> = {
  PERSON: "title_person"
};
