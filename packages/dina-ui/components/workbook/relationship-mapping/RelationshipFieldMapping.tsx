import Accordion from "react-bootstrap/Accordion";
import { useWorkbookContext } from "../WorkbookProvider";
import FieldMappingConfig from "../utils/FieldMappingConfig";
import { useWorkbookConverter } from "../utils/useWorkbookConverter";

export interface RelationshipFieldMappingProps {
  sheetIndex: number;
}

export function RelationshipFieldMapping({
  sheetIndex
}: RelationshipFieldMappingProps) {
  const { columnUniqueValues, type, workbookColumnMap, setColumnMapValue } =
    useWorkbookContext();
  const selectedType = type ?? "material-sample";
  const { getResourceSelectForRelationshipField } = useWorkbookConverter(
    FieldMappingConfig,
    selectedType
  );

  return columnUniqueValues && columnUniqueValues[sheetIndex] ? (
    <Accordion defaultActiveKey="0">
      {Object.keys(columnUniqueValues[sheetIndex])
        .filter(
          (columnName) =>
            workbookColumnMap[columnName]?.mapRelationship &&
            workbookColumnMap[columnName].showOnUI
        )
        .map((columnName, index) => {
          const thisColumnMap = workbookColumnMap[columnName]!;
          const fieldPath = thisColumnMap.fieldPath;

          const counts = columnUniqueValues[sheetIndex][columnName];
          return (
            <Accordion.Item eventKey={"" + index} key={columnName}>
              <Accordion.Header>{columnName}</Accordion.Header>
              <Accordion.Body>
                <div
                  className="row mb-2"
                  style={{ borderBottom: "solid 1px", paddingBottom: "8px" }}
                >
                  <div className="col-3">Value</div>
                  <div className="col-3">Count</div>
                  <div className="col-6" />
                </div>
                {Object.keys(counts).map((fieldValue) => (
                  <div className="row" key={fieldValue}>
                    <div className="col-3">{fieldValue}</div>
                    <div className="col-3">{counts[fieldValue]}</div>
                    <div className="col-6">
                      {getResourceSelectForRelationshipField(
                        columnName,
                        fieldPath!,
                        fieldValue,
                        (newValue: any) => {
                          const newValueMapping = {
                            ...thisColumnMap.valueMapping
                          };
                          if (newValue) {
                            if (Array.isArray(newValue)) {
                              newValueMapping[fieldValue] = {
                                id: newValue[0].id,
                                type: newValue[0].type
                              };
                            } else {
                              newValueMapping[fieldValue] = {
                                id: newValue.id,
                                type: newValue.type
                              };
                            }
                          } else {
                            delete newValueMapping[fieldValue];
                          }
                          const newColumnMap = {
                            ...workbookColumnMap,
                            [columnName]: {
                              ...thisColumnMap,
                              valueMapping: newValueMapping
                            }
                          };
                          setColumnMapValue(newColumnMap);
                        }
                      )}{" "}
                    </div>
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
