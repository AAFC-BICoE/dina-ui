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
  const { columnUniqueValues, type, workbookColumnMap} = useWorkbookContext();
  const selectedType = type ?? "material-sample";
  const { getResourceSelectForRelationshipField } = useWorkbookConverter(
    FieldMappingConfig,
    selectedType
  );

  return columnUniqueValues && columnUniqueValues[sheetIndex] ? (
    <Accordion defaultActiveKey="0">
      {Object.keys(columnUniqueValues[sheetIndex])
        .filter((columnName) => workbookColumnMap[columnName]?.mapRelationship)
        .map((columnName, index) => {
          const fieldPath = workbookColumnMap[columnName]?.fieldPath;
          
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
                  <div className="col-6"></div>
                </div>
                {Object.keys(counts).map((fieldValue) => (
                  <div className="row" key={fieldValue}>
                    <div className="col-3">{fieldValue}</div>
                    <div className="col-3">{counts[fieldValue]}</div>
                    <div className="col-6">{getResourceSelectForRelationshipField(columnName, fieldPath!, fieldValue )} </div>
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
