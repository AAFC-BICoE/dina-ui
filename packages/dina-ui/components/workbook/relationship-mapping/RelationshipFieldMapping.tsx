import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { Card } from "react-bootstrap";
import { useWorkbookContext } from "../WorkbookProvider";
import { useColumnMapping } from "../column-mapping/useColumnMapping";
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
  const { getResourceSelectField } = useColumnMapping(sheetIndex, selectedType);

  return columnUniqueValues && columnUniqueValues[sheetIndex] ? (
    <Card
      className="mb-3"
      style={{ width: "100%", overflowX: "auto", height: "70hp" }}
    >
      <Card.Header style={{ fontSize: "1.4em" }}>
        <DinaMessage id="mapRelationshipTitle" />
      </Card.Header>
      <Card.Body className="mb-3 px-4 py-2">
        <style>
          {`
            .black-border {
              border-bottom: solid 1px;
            }
            .odd {
              background-color: rgba(0, 0, 0, 0.03)
            }
          `}
        </style>
        <div className="row mb-2 black-border">
          <div className="col-3">
            <DinaMessage id="spreadsheetHeader" />
          </div>
          <div className="col-3">
            <DinaMessage id="value" />
          </div>
          <div className="col-3">
            <DinaMessage id="count" />
          </div>
          <div className="col-3" />
        </div>
        {Object.keys(columnUniqueValues[sheetIndex])
          .filter(
            (columnName) =>
              workbookColumnMap[columnName]?.mapRelationship &&
              workbookColumnMap[columnName].showOnUI
          )
          .map((columnName, index1) => {
            const thisColumnMap = workbookColumnMap[columnName]!;
            const fieldPath = thisColumnMap.fieldPath;
            const counts = columnUniqueValues[sheetIndex][columnName];
            return Object.keys(counts).map((fieldValue, index2) => (
              <div
                className={`row${index1 % 2 === 0 ? " odd" : ""}`}
                key={fieldValue}
              >
                <div className="col-3">{index2 === 0 ? columnName : ""}</div>
                <div className="col-3">{fieldValue}</div>
                <div className="col-3">{counts[fieldValue]}</div>
                <div className="col-3">
                  {getResourceSelectField(columnName, fieldPath, fieldValue)}
                </div>
              </div>
            ));
          })}
      </Card.Body>
    </Card>
  ) : (
    <></>
  );
}
