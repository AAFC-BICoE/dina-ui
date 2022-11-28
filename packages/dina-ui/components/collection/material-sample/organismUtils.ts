import {
  MaterialSample,
  Organism
} from "packages/dina-ui/types/collection-api";

/** Retrieves all the scientific names for a material sample */
export function getScientificNames(materialSample: MaterialSample) {
  const organisms = materialSample.organism as Organism[];
  if (!organisms) return "";

  const targetOrganism = organisms.filter(
    (organism) => organism.isTarget === true
  );

  // Check if a target organism is found or if all the organisms will need to be checked.
  if (targetOrganism.length === 1) {
    return getDeterminations(targetOrganism);
  } else {
    return getDeterminations(organisms);
  }
}

function getDeterminations(organisms: Organism[]) {
  // List of everything to be displayed.
  const determinationList: string[] = [];

  const primaryDeterminations = organisms.map(
    (organism) => organism.determination
  );

  primaryDeterminations.forEach((determinations) => {
    determinations?.forEach((determination) => {
      if (determination.isPrimary) {
        if (determination?.scientificName) {
          determinationList.push(determination.scientificName);
        } else if (determination?.verbatimScientificName) {
          determinationList.push(determination.verbatimScientificName);
        }
      }
    });
  });

  return determinationList.join(", ");
}
