import { PersistedResource } from "kitsu";
import { padStart } from "lodash";
import { MaterialSample } from "../../../types/collection-api";

/** Calculates the next sample name based on the previous name's suffix. */
export function nextSampleName(previousName?: string | null): string {
  if (!previousName) {
    return "";
  }

  const originalNumberSuffix = /\d+$/.exec(previousName)?.[0];

  if (!originalNumberSuffix) {
    return "";
  }

  const suffixLength = originalNumberSuffix.length;
  const nextNumberSuffix = padStart(
    (Number(originalNumberSuffix) + 1).toString(),
    suffixLength,
    "0"
  );
  const newMaterialSampleName = nextNumberSuffix
    ? previousName.replace(/\d+$/, nextNumberSuffix)
    : previousName;

  return newMaterialSampleName;
}

export function nextSampleInitialValues(
  originalSample: PersistedResource<MaterialSample>
) {
  // Use the copied sample as a base, omitting some fields that shouldn't be copied:
  const {
    id,
    createdOn,
    createdBy,
    materialSampleName,
    allowDuplicateName,
    organism,
    ...copiedValues
  } = originalSample;

  // Omit the IDs from the original sample's organisms:
  const newOrganisms = organism?.map((org) => org && { ...org, id: undefined });

  // Calculate the next suffix:
  const newMaterialSampleName = nextSampleName(materialSampleName);

  // Some data-components should not automatically be copied over to the material sample.
  // An alert will appear for the user to copy these data components over if the user wishes to
  // duplicate these over.
  // console.log(copiedValues);

  const initialValues = {
    ...copiedValues,
    materialSampleName: newMaterialSampleName,
    organism: newOrganisms
  };

  return initialValues;
}
