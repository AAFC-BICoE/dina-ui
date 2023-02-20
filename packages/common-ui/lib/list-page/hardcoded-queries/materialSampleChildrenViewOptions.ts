import { MaterialSample } from "packages/dina-ui/types/collection-api/resources/MaterialSample";
import { CustomQueryOption } from "../../custom-query-view/CustomQueryPageView";
import { generateDirectMaterialSampleChildrenTree } from "./directMaterialSampleChildrenQuery";
import { materialSampleCultureStrainChildrenQuery } from "./materialSampleCultureStrainChildrenQuery";

export const materialSampleChildrenViewOptions = (
  materialSample: MaterialSample
): CustomQueryOption[] => [
  {
    value: "materialSampleChildren",
    labelKey: "childMaterialSamples",
    customElasticSearch: generateDirectMaterialSampleChildrenTree(
      materialSample.id ?? ""
    )
  },
  {
    value: "cultureStrains",
    labelKey: "childCultureStrains",
    customElasticSearch: materialSampleCultureStrainChildrenQuery(
      materialSample?.hierarchy?.reduce((prev, current) =>
        (prev?.rank ?? 0) > (current?.rank ?? 0) ? prev : current
      )?.uuid ?? ""
    )
  }
];
