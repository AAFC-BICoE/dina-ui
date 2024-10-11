import { PersistedResource } from "kitsu";
import { padStart } from "lodash";
import { MaterialSample } from "../../../types/collection-api";
import { createContext, useContext } from "react";

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

  // Remove storage if coordinates are provided since that's specific to

  const initialValues = {
    ...copiedValues,
    materialSampleName: newMaterialSampleName,
    organism: newOrganisms
  };

  return initialValues;
}

export interface NotCopiedOverWarning {
  componentName: string;

  /**
   * Triggered if the user wants to duplicate the information over.
   * @param materialSample Original material sample to alter.
   * @returns
   */
  duplicateAnyway: (materialSample: MaterialSample) => void;
}

export interface CopyToNextSampleContextI {
  /**
   * The original initial values before changes are made.
   */
  originalSample: MaterialSample;

  /** Warnings to display to the user and logic for adding it back if the user wants to. */
  notCopiedOverWarnings: NotCopiedOverWarning[];
}

const CopyToNextSampleContext = createContext<CopyToNextSampleContextI | null>(
  null
);
export const CopyToNextSampleProvider = CopyToNextSampleContext.Provider;

/** If it's a copied next sample, this hook will return all of the CopyToNextSampleContext props */
export function useCopyToNextSample(): CopyToNextSampleContextI | null {
  const ctx = useContext(CopyToNextSampleContext);
  return ctx ? ctx : null;
}
