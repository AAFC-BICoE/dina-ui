import { MaterialSample } from "../../../../dina-ui/types/collection-api";
import { useFieldConverters } from "./useFieldConverters";

export function useMateriaSampleConverter(mappingConfig: {
  [key: string]: { field: string; dataType: string }[];
}) {
  const { getConverter } = useFieldConverters(mappingConfig);

  function convertEntity(value: { [key: string]: any }): MaterialSample {
    const materialSample: MaterialSample = {} as MaterialSample;
    for (const field of Object.keys(value)) {
      const convertField = getConverter("materialSample", field);
      if (!!convertField) {
        materialSample[field] = convertField(value[field]);
      }
    }
    return materialSample;
  }

  return { convertEntity };
}
