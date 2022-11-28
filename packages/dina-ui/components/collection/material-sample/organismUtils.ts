import { MaterialSample, Organism } from "packages/dina-ui/types/collection-api";


/** Retrives all the scientific names for a material sample */
export function getScientificNames(materialSample: MaterialSample) {
    const organisms = materialSample.organism as Organism[];
    if (!organisms) return "";

    const targetOrganisms = organisms.filter((organism) => organism?.isTarget === true);

    if(targetOrganisms.length == 0){
        return getDeterminations(organisms);
    }
    else{
        return getDeterminations(targetOrganisms);
    }
}

function getDeterminations(organisms: Organism[]) {
    let determinationList: string[] = [];
    const primaryDetermination = organisms.filter((organism) => organism?.determination?.filter(
        (singleDetermination) => singleDetermination.isPrimary === true)).map((organism) => organism.determination);

    primaryDetermination.forEach((determinations) => {
        determinations?.forEach((determination) => {
            if (determination?.scientificName) {
                determinationList.push(determination.scientificName);
            } else if (determination?.verbatimScientificName) {
                determinationList.push(determination.verbatimScientificName);
            }
        })
    });

    return determinationList.join(", ");
}