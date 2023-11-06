import { useWorkbookContext } from "../WorkbookProvider";
import FieldMappingConfig from "../utils/FieldMappingConfig";
import { useWorkbookConverter } from "../utils/useWorkbookConverter";

export interface RelationshipFieldMappingProps {
  sheetIndex: number;
  columnName: string;
}

export function RelationshipFieldMapping({
  sheetIndex,
  columnName
}: RelationshipFieldMappingProps) {
  const { columnUniqueValues, type, workbookColumnMap } = useWorkbookContext();
  const selectedType = type ?? "material-sample";
  const { getResourceSelectForRelationshipField } = useWorkbookConverter(
    FieldMappingConfig,
    selectedType
  );

  /*
WorkbookColumnMap {
  [columnName: string]: // columnName in the spreadsheet
  | {
        fieldPath: string; // Mapped fieldPath in the configuration
        mapRelationship: boolean; // If relationship mapping needed.
      }
    | undefined;

ColumnUniqueValues {
  [sheetIndex: number]: {
    [columnName: string]: {
      [value: string]: number;
    };
  };
}
}*/

  return (
    <>
      {columnUniqueValues &&
        columnUniqueValues[sheetIndex] &&
        workbookColumnMap[columnName] &&
        workbookColumnMap[columnName]?.mapRelationship &&
        Object.keys(columnUniqueValues[sheetIndex]).map((columnName) => {
          const counts = columnUniqueValues[sheetIndex][columnName];
          return (
            <>
              <div>{columnName}</div>
              {Object.keys(counts).map((fieldValue) => (
                <div className="row">
                  <div className="col-3">{fieldValue}</div>
                  <div className="col-3">{counts[fieldValue]}</div>
                  <div className="col-6"> resource select dropdown </div>
                </div>
              ))}
            </>
          );
        })}
    </>
  );
}
