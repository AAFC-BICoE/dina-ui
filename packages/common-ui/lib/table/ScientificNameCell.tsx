import {
  getDeterminations,
  getScientificNames
} from "../../../dina-ui/components";
import {
  MaterialSample,
  Determination
} from "../../../dina-ui/types/collection-api";
import { FieldHeader } from "../field-header/FieldHeader";
import { TableColumn } from "../list-page/types";

export function scientificNameCell(): TableColumn<MaterialSample> {
  return {
    id: "scientificName",
    cell: ({ row: { original } }) => {
      let scientificNames: string = "";

      if (original?.type === "material-sample") {
        let determinations: Determination[] = [];
        (original as any)?.included?.organism?.forEach((org) => {
          determinations = determinations.concat(
            org?.determination ?? org?.attributes?.determination
          );
        });
        const organism = (original as any)?.included?.organism?.map((org) => ({
          id: org?.id,
          type: org?.type,
          determination: org?.determination ?? org?.attributes?.determination,
          isTarget: org?.isTarget ?? org?.attributes?.isTarget
        }));
        const materialSample: MaterialSample = {
          type: "material-sample",
          materialSampleName: (original as any)?.data?.attributes
            ?.materialSampleName,
          organism
        };
        scientificNames = getScientificNames(materialSample);
      } else {
        scientificNames = getDeterminations(
          (original as any)?.effectiveDeterminations
        );
      }
      return <div className="stringArray-cell">{scientificNames}</div>;
    },
    header: () => <FieldHeader name="determination.scientificName" />,
    isKeyword: true,
    enableSorting: false,
    additionalAccessors: [
      "included.attributes.determination",
      "included.attributes.isTarget"
    ]
  };
}
