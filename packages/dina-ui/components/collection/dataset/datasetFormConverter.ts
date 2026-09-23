import { InputResource } from "kitsu";
import _ from "lodash";
import { Dataset } from "../../../types/collection-api";
import { AgentRole } from "../../../types/loan-transaction-api";
import { License } from "../../../types/objectstore-api";

/** The Dataset shape the form works with: multilingual fields as flat dictionaries. */
export interface DatasetFormValues
  extends Omit<
    InputResource<Dataset>,
    "multilingualTitle" | "multilingualDescription"
  > {
  multilingualTitle?: Record<string, string | undefined>;
  multilingualDescription?: Record<string, string | undefined>;

  /**
   * Client-side-only field holding the License resource picked in the dropdown.
   * usageRights.licenseName/licenseUrl are derived from it on save, the same way
   * the Object Store derives Metadata.xmpRightsWebStatement from its picker.
   */
  license?: License | null;
}

/** A Dataset with the License resolved from usageRights.licenseUrl. */
export type DatasetWithLicense = Dataset & { license?: License | null };

/**
 * The stored licence name. Uses the English title so the name persisted for EML
 * export stays the same no matter which locale the record was edited in.
 */
function licenseNameOf(license: License): string {
  return (
    license.titles?.en ?? Object.values(license.titles ?? {})[0] ?? license.url
  );
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

export function convertDatasetToFormData(
  dataset?: DatasetWithLicense
): DatasetFormValues {
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

export function convertFormDataToDataset(
  values: DatasetFormValues
): InputResource<Dataset> {
  // The licence dropdown is the source of truth for the stored name and URL:
  const { license, ...rest } = values;
  const usageTerms = values.usageRights?.usageTerms;
  const usageRights =
    license || usageTerms
      ? {
          licenseName: license ? licenseNameOf(license) : undefined,
          licenseUrl: license?.url,
          usageTerms
        }
      : undefined;

  return {
    ...rest,
    usageRights,
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
