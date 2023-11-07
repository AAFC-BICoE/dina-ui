import { useWorkbookContext } from "../WorkbookProvider";
import FieldMappingConfig from "../utils/FieldMappingConfig";
import { useWorkbookConverter } from "../utils/useWorkbookConverter";
import Accordion from "react-bootstrap/Accordion";

export interface RelationshipFieldMappingProps {
  sheetIndex: number;
}

export function RelationshipFieldMapping({
  sheetIndex
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

  /*
{columnUniqueValues &&
      columnUniqueValues[sheetIndex]
        ? Object.keys(columnUniqueValues[sheetIndex])
            .filter(
              (columnName) => workbookColumnMap[columnName]?.mapRelationship
            )
            .map((columnName) => {
              const counts = columnUniqueValues[sheetIndex][columnName];
              return (
                <>
                  <div>{columnName}</div>
                  {Object.keys(counts).map((fieldValue, index) => (
                    <div className="row" key={index}>
                      <div className="col-3">{fieldValue}</div>
                      <div className="col-3">{counts[fieldValue]}</div>
                      <div className="col-6"> resource select dropdown </div>
                    </div>
                  ))}
                </>
              );
            })
        : undefined}
*/

  return columnUniqueValues && columnUniqueValues[sheetIndex] ? (
    <Accordion defaultActiveKey="0">
      {Object.keys(columnUniqueValues[sheetIndex])
        .filter((columnName) => workbookColumnMap[columnName]?.mapRelationship)
        .map((columnName, index) => {
          const counts = columnUniqueValues[sheetIndex][columnName];
          return (
            <Accordion.Item eventKey={"" + index} key={columnName}>
              <Accordion.Header>{columnName}</Accordion.Header>
              <Accordion.Body>
                <div className="row">
                  <div className="col-3">Value</div>
                  <div className="col-3">Count</div>
                  <div className="col-6"></div>
                </div>
                {Object.keys(counts).map((fieldValue) => (
                  <div className="row" key={fieldValue}>
                    <div className="col-3">{fieldValue}</div>
                    <div className="col-3">{counts[fieldValue]}</div>
                    <div className="col-6"> resource select dropdown </div>
                  </div>
                ))}
              </Accordion.Body>
            </Accordion.Item>
          );
        })}
    </Accordion>
  ) : (
    <></>
  );
}
