import { InputResource, KitsuResource } from "kitsu";
import { DataTypeEnum, useFieldConverters } from "./useFieldConverters";

export function useWorkbookConverter(
  entityType: string,
  mappingConfig: {
    [key: string]: { [field: string]: { dataType: DataTypeEnum } };
  }
) {
  const { getConverter } = useFieldConverters(mappingConfig);

  function convertWorkbook(
    workbookData: { [key: string]: any }[],
    group: string
  ): InputResource<KitsuResource & { group?: string }>[] {
    const data: InputResource<KitsuResource & { group?: string }>[] = [];
    for (const workbookRow of workbookData) {
      const dataItem: InputResource<KitsuResource & { group?: string }> = {
        type: entityType,
        group
      } as InputResource<KitsuResource & { group?: string }>;
      for (const field of Object.keys(workbookRow)) {
        const convertField = getConverter(entityType, field);
        if (!!convertField) {
          dataItem[field] = convertField(workbookRow[field]);
        }
      }
      data.push(dataItem);
    }
    return data;
  }

  return { convertWorkbook };
}
