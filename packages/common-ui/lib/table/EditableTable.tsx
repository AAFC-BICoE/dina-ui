import { FieldArray, FieldArrayRenderProps } from "formik";
import { useRef } from "react";
import { Button, Table } from "react-bootstrap";
import { Accessor, Column } from "react-table";
import { FieldHeader } from "../field-header/FieldHeader";
import { TextField } from "../formik-connected/TextField";
import { InternationalizationProps } from "./QueryTable";

export interface EditableTableColumn<D = any>
  extends Column.Basics,
    Column.CellProps,
    Column.HeaderProps {
  /**
   * Property name as string or Accessor
   * @example: 'myProperty'
   * @example ["a.b", "c"]
   * @example ["a", "b", "c"]
   * @example {"a": {"b": {"c": $}}}
   * @example (row) => row.propertyName
   */
  accessor?: Accessor<D> | undefined;
}

export type EditableTableColumnDefinition<TData> = Partial<
  EditableTableColumn<TData> & InternationalizationProps
>;

export interface EditableTableProps<TData> {
  fieldName: string;
  data: TData[];
  /** The columns to show in the table. */
  columns: EditableTableColumnDefinition<TData>[];
  /** readonly */
  readOnly?: boolean;
}

export function EditableTable<TData>({
  fieldName,
  data,
  columns,
  readOnly = false
}: EditableTableProps<TData>) {
  const arrayHelpersRef = useRef<FieldArrayRenderProps>(
    {} as FieldArrayRenderProps
  );

  const mappedColumnHeaders = columns.map((column, index) => (
    <th key={index}>
      {!!column.label ? (
        <FieldHeader name={column.label} />
      ) : (
        <FieldHeader name={String(column.accessor)} />
      )}
    </th>
  ));

  if (readOnly === false) {
    mappedColumnHeaders.push(<th />);
  }

  const mappedRows = readOnly ? (
    data ? (
      data.map((rec, rowIndex) => (
        <tr key={rowIndex}>
          {columns.map((column, colIndex) => (
            <td key={colIndex}>{rec[String(column.accessor)]}</td>
          ))}
        </tr>
      ))
    ) : undefined
  ) : (
    <FieldArray
      name={fieldName}
      render={(arrayHelpers) => {
        arrayHelpersRef.current = arrayHelpers;
        return data
          ? data.map((_rec, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, columnIndex) => (
                  <td key={columnIndex}>
                    <TextField
                      name={`${fieldName}[${rowIndex}][${String(
                        column.accessor
                      )}]`}
                      hideLabel={true}
                    />
                  </td>
                ))}
                <td className="text-center">
                  <Button
                    style={{ padding: "0px 10px 3px", marginTop: "12px" }}
                    variant="primary"
                    onClick={() => arrayHelpers.remove(rowIndex)}
                  >
                    -
                  </Button>
                </td>
              </tr>
            ))
          : undefined;
      }}
    />
  );

  const addItem = () => {
    if (
      arrayHelpersRef &&
      arrayHelpersRef.current &&
      arrayHelpersRef.current.push !== undefined
    ) {
      arrayHelpersRef.current.push({});
    }
  };

  return (
    <>
      <Table striped={true} bordered={true} hover={true}>
        <thead>
          <tr>{mappedColumnHeaders}</tr>
        </thead>
        <tbody>{mappedRows}</tbody>
      </Table>
      {readOnly ? undefined : (
        <div className="text-end">
          <Button
            variant="primary"
            style={{
              padding: "0px 10px",
              marginRight: "35px",
              marginTop: "10px"
            }}
            onClick={() => addItem()}
          >
            +
          </Button>
        </div>
      )}
    </>
  );
}
