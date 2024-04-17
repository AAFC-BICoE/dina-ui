import { Card } from "react-bootstrap";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { useWorkbookContext } from "../WorkbookProvider";
import { useColumnMapping } from "../column-mapping/useColumnMapping";
import { useEffect, useMemo } from "react";
import { useFormikContext } from "formik";
import { FieldMapType } from "../column-mapping/WorkbookColumnMapping";

export interface RelationshipFieldMappingProps {
  sheetIndex: number;
  onChangeRelatedRecord: (columnHeader: string, fieldValue: string, relatedRecord: string, targetType: string) => void;
  groupName: string;
}

export function RelationshipFieldMapping({
  sheetIndex,
  onChangeRelatedRecord,
  groupName
}: RelationshipFieldMappingProps) {
  const { columnUniqueValues, type, workbookColumnMap, relationshipMapping } =
    useWorkbookContext();
  const selectedType = type ?? "material-sample";
  const { getResourceSelectField } = useColumnMapping(
    groupName,
    sheetIndex,
    selectedType
  );

  const { setValues, values } = useFormikContext();

  // When the relationship mapping changes, it should update the formik values.
  useEffect(() => {
    setValues((values, _validated) => ({
      ...values,
      relationshipMapping
    }));
  }, [relationshipMapping]);

  // Do not display skipped records on the relationship mapping section, this array contains the path and if it's skipped.
  const skippedRecords = useMemo(() => {
    const fieldMap = ((values as any)?.["fieldMap"] as FieldMapType[] | undefined);
    if (fieldMap === undefined) return {};
  
    return fieldMap.reduce((acc, record) => {
      if (record.targetField) {
        acc[record.targetField] = record.skipped;
      }
      return acc;
    }, {});
  }, [values?.["fieldMap"]]);

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
          <div className="col-3">
            <DinaMessage id="relatedRecord" />
          </div>
        </div>
        {Object.keys(columnUniqueValues[sheetIndex])
          .filter(
            (columnName) =>
              workbookColumnMap[columnName]?.mapRelationship &&
              workbookColumnMap[columnName].showOnUI &&
              skippedRecords[workbookColumnMap[columnName].fieldPath ?? ""] === false
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
                  {getResourceSelectField(onChangeRelatedRecord, columnName, fieldPath, fieldValue)}
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
