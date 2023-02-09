import { KitsuResource } from "kitsu";
import { DataTypeEnum, useFieldConverters } from "./useFieldConverters";

export function useWorkbookConverter<
  TData extends KitsuResource = KitsuResource
>(
  entityType: string,
  mappingConfig: {
    [key: string]: { [field: string]: { dataType: DataTypeEnum } };
  }
) {
  const { getConverter } = useFieldConverters(mappingConfig);

  function convertWorkbook(workbookData: { [key: string]: any }[]): TData[] {
    const data: TData[] = [];
    for (const workbookRow of workbookData) {
      const dataItem: TData = { type: entityType } as TData;
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
