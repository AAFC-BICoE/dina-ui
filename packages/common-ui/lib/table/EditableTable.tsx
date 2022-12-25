import { useState } from "react";
import { Button } from "react-bootstrap";
import ReactTable, { Column, SortingRule, TableProps } from "react-table";
import { Promisable } from "type-fest";
import { FieldHeader } from "../field-header/FieldHeader";
import { CommonMessage } from "../intl/common-ui-intl";
import {
  DefaultTBody,
  DefaultTd,
  InternationalizationProps
} from "./QueryTable";
import { useEditableCell } from "./useEditableCell";

export interface FormatterParserProps {
  formatter?: (value: any) => string;
  parser?: (value: string) => any;
}

export type EditableTableColumnDefinition<TData> =
  | (Column<TData> & InternationalizationProps & FormatterParserProps)
  | string;

export interface EditableTableProps<TData> {
  data: TData[];
  setData: (data: TData[]) => Promisable<void>;
  /** The columns to show in the table. */
  columns: EditableTableColumnDefinition<TData>[];
  /** Default sort attribute. */
  defaultSort?: SortingRule[];
  /** internal react-table props. */
  reactTableProps?: Partial<TableProps>;
  /** readonly */
  readonly?: boolean;
}

export function EditableTable<TData>({
  data,
  setData,
  columns,
  defaultSort,
  reactTableProps,
  readonly = false
}: EditableTableProps<TData>) {
  const [sortingRules, setSortingRules] = useState(defaultSort);
  const rederEditableCell = useEditableCell({ data, setData, readonly });

  const mappedColumns = columns.map<Column>((column) => {
    // The "columns" prop can be a string or a react-table Column type.
    const { fieldName, customHeader } =
      typeof column === "string"
        ? {
            customHeader: undefined,
            fieldName: column
          }
        : {
            customHeader: column.Header,
            fieldName: String(column.accessor)
          };

    const Header = customHeader ?? <FieldHeader name={fieldName} />;

    return {
      Header,
      ...(typeof column === "string"
        ? { accessor: column, Cell: rederEditableCell() }
        : {
            ...column,
            Cell: rederEditableCell(column.formatter, column.parser)
          })
    };
  });

  if (readonly === false) {
    mappedColumns.push({
      Header: "",
      Cell: ({ index }) => (
        <div className="text-center">
          <Button
            style={{ padding: "0px 10px 3px" }}
            variant="outline-secondary"
            onClick={(e) => deleteItem(e, index)}
          >
            -
          </Button>
        </div>
      ),
      width: 100,
      sortable: false
    });
  }

  const addItem = (e) => {
    e.preventDefault();
    const tempData = [...data];
    tempData.push({} as TData);
    setData(tempData);
  };

  const deleteItem = (e, index: number) => {
    e.preventDefault();
    const tempData = [...data];
    tempData.splice(index, 1);
    setData(tempData);
  };

  return (
    <>
      <ReactTable
        TdComponent={DefaultTd}
        className="-striped"
        columns={mappedColumns}
        data={data}
        defaultSorted={sortingRules}
        showPagination={false}
        minRows={1}
        noDataText={<CommonMessage id="noRowsFound" />}
        TbodyComponent={reactTableProps?.TbodyComponent ?? DefaultTBody}
      />
      {readonly ? (
        ""
      ) : (
        <div className="text-end">
          <Button
            variant="outline-secondary"
            style={{
              padding: "0px 10px",
              marginRight: "35px",
              marginTop: "10px"
            }}
            onClick={(e) => addItem(e)}
          >
            +
          </Button>
        </div>
      )}
    </>
  );
}
