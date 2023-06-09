import {
  Determination,
  MaterialSample,
  Organism
} from "packages/dina-ui/types/collection-api";

/**
 * Comma separated string with all of the scientific names of the organisms.
 *
 * isTarget and isPrimary are used to find the specific scientific name. If multiple
 * primary determinations are found then a comma separated list is supplied.
 *
 * @param materialSample A material sample.
 * @returns Empty string if no organism or no scientific names can be found.
 */
export function getScientificNames(materialSample: MaterialSample) {
  const organisms = materialSample.organism as Organism[];
  if (!organisms) return "";
  const targetOrganism: Organism | undefined = organisms?.find(
    (organism) => organism.isTarget === true
  );

  let determinations: Determination[] = [];

  // Check if a target organism is found or if all the organisms will need to be checked.
  if (targetOrganism?.determination) {
    determinations = determinations.concat(targetOrganism.determination);
  } else {
    organisms.forEach((organism) => {
      if (organism?.determination) {
        determinations = determinations.concat(organism.determination);
      }
    });
  }
  return getDeterminations(determinations);
}

export function getDeterminations(determinations: Determination[] | undefined) {
  if (!determinations) {
    return "";
  }
  const scientificNames: string[] = [];
  determinations.forEach((determination) => {
    if (determination.isPrimary) {
      if (determination.scientificName) {
        scientificNames.push(determination.scientificName);
      } else if (determination.verbatimScientificName) {
        scientificNames.push(determination.verbatimScientificName);
      }
    }
  });

  return scientificNames.join(", ");
}
