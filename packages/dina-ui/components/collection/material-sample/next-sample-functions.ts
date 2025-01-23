import { PersistedResource } from "kitsu";
import { padStart } from "lodash";
import { MaterialSample } from "../../../types/collection-api";
import { createContext, useContext } from "react";
import { FormikContextType } from "formik";
import { useMaterialSampleSave } from "./useMaterialSample";

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
    id: _id,
    createdOn: _createdOn,
    createdBy: _createdBy,
    materialSampleName,
    allowDuplicateName: _allowDuplicateName,
    organism,
    ...copiedValues
  } = originalSample;

  let notCopiedOverWarnings: NotCopiedOverWarning[] = [];

  // Omit the IDs from the original sample's organisms:
  const newOrganisms = organism?.map((org) => org && { ...org, id: undefined });

  // Calculate the next suffix:
  const newMaterialSampleName = nextSampleName(materialSampleName);

  const storageUnitUsageFound = !!copiedValues?.storageUnitUsage?.id;
  const attachmentFound =
    !!copiedValues?.attachment && copiedValues?.attachment?.length > 0;

  // Remove storage if coordinates are provided since that's specific to the previous material sample.
  if (storageUnitUsageFound) {
    notCopiedOverWarnings = [
      ...notCopiedOverWarnings,
      {
        componentName: "Storage",
        duplicateAnyway(materialSample, formik, dataComponentState) {
          // Remove the ID here so a new one is generated on save.
          const duplicatedStorageUnitUsage = {
            ...materialSample.storageUnitUsage,
            id: undefined
          };

          formik.setFieldValue("storageUnit", materialSample.storageUnit);
          formik.setFieldValue("storageUnitUsage", duplicatedStorageUnitUsage);
          dataComponentState.setEnableStorage(true);
        }
      }
    ];
  }

  // Attachments should not be copied over since they are also specific to the previous material sample.
  if (attachmentFound) {
    notCopiedOverWarnings = [
      ...notCopiedOverWarnings,
      {
        componentName: "Attachment",
        duplicateAnyway(materialSample, formik, _) {
          formik.setFieldValue("attachment", materialSample.attachment);
        }
      }
    ];
  }

  const initialValues = {
    ...copiedValues,
    materialSampleName: newMaterialSampleName,
    organism: newOrganisms,
    ...(storageUnitUsageFound
      ? { storageUnit: undefined, storageUnitUsage: undefined }
      : {}),
    ...(attachmentFound ? { attachment: undefined } : {})
  };

  return { initialValues, notCopiedOverWarnings };
}

export interface NotCopiedOverWarning {
  componentName: string;

  /**
   * Triggered if the user wants to duplicate the information over.
   * @param materialSample Original material sample to alter.
   * @returns
   */
  duplicateAnyway: (
    materialSample: MaterialSample,
    formik: FormikContextType<any>,
    componentStates: ReturnType<
      typeof useMaterialSampleSave
    >["dataComponentState"]
  ) => void;
}

export interface CopyToNextSampleContextI {
  /**
   * The original initial values before changes are made.
   */
  originalSample: MaterialSample;

  /** UUID of the copied material sample */
  lastCreatedId: string;

  /** Warnings to display to the user and logic for adding it back if the user wants to. */
  notCopiedOverWarnings: NotCopiedOverWarning[];

  /** Used to remove a warning from once it has been dismissed or actioned. */
  removeWarning: (warningToRemove: NotCopiedOverWarning) => void;
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
