import { InputResource } from "kitsu";
import _ from "lodash";
import { Dataset } from "../../../types/collection-api";
import { AgentRole } from "../../../types/loan-transaction-api";

/** The Dataset shape the form works with: multilingual fields as flat dictionaries. */
export interface DatasetFormValues
  extends Omit<
    InputResource<Dataset>,
    "multilingualTitle" | "multilingualDescription"
  > {
  multilingualTitle?: Record<string, string | undefined>;
  multilingualDescription?: Record<string, string | undefined>;
}

/** Agents are stored as UUIDs but edited as Person objects. */
function agentRolesToFormData(agentRoles?: AgentRole[] | null): AgentRole[] {
  return (agentRoles ?? []).map((agentRole) => ({
    ...agentRole,
    agent:
      typeof agentRole.agent === "string"
        ? { id: agentRole.agent, type: "person" }
        : agentRole.agent
  }));
}

function formDataToAgentRoles(agentRoles?: AgentRole[] | null): AgentRole[] {
  return (agentRoles ?? []).map((agentRole) => ({
    ...agentRole,
    agent:
      typeof agentRole.agent === "object"
        ? agentRole.agent?.id
        : agentRole.agent
  }));
}

export function useDatasetFormConverter() {
  function convertDatasetToFormData(dataset?: Dataset): DatasetFormValues {
    if (!dataset) {
      return { type: "dataset" };
    }

    return {
      ...dataset,
      // Convert the multilingual fields to the editable Dictionary format:
      multilingualTitle: _.fromPairs<string | undefined>(
        dataset.multilingualTitle?.titles?.map(({ title, lang }) => [
          lang ?? "",
          title ?? ""
        ])
      ),
      multilingualDescription: _.fromPairs<string | undefined>(
        dataset.multilingualDescription?.descriptions?.map(({ desc, lang }) => [
          lang ?? "",
          desc ?? ""
        ])
      ),
      agentRoles: agentRolesToFormData(dataset.agentRoles),
      project: dataset.project
        ? {
            ...dataset.project,
            personnel: agentRolesToFormData(dataset.project.personnel)
          }
        : undefined
    };
  }

  function convertFormDataToDataset(
    values: DatasetFormValues
  ): InputResource<Dataset> {
    return {
      ...values,
      // Convert the editable Dictionary format back to the stored format:
      multilingualTitle: {
        titles: _.toPairs(values.multilingualTitle).map(([lang, title]) => ({
          lang,
          title
        }))
      },
      multilingualDescription: {
        descriptions: _.toPairs(values.multilingualDescription).map(
          ([lang, desc]) => ({ lang, desc })
        )
      },
      agentRoles: formDataToAgentRoles(values.agentRoles),
      project: values.project
        ? {
            ...values.project,
            personnel: formDataToAgentRoles(values.project.personnel)
          }
        : undefined
    };
  }

  return { convertDatasetToFormData, convertFormDataToDataset };
}
