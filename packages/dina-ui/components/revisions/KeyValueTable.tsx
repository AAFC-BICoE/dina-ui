import { DefaultTd, FieldHeader } from "common-ui";
import { toPairs } from "lodash";
import { ComponentType } from "react";
import ReactTable, { CellInfo } from "react-table";
import { DinaMessage } from "../../intl/dina-ui-intl";

export interface KeyValueTableProps {
  /** The object whose keys and values are to be shown. */
  data: Record<string, any>;

  /** The value cell Component for a specific field can be overriden for displaying complex object types. */
  customValueCells?: Record<string, ComponentType<CellInfo>>;
}

/** Table that shows an object's keys in the left column and values in the right column. */
export function KeyValueTable({ customValueCells, data }: KeyValueTableProps) {
  const pairs = toPairs(data);
  const entries = pairs.map(([field, value]) => ({
    field,
    value
  }));

  return (
    <ReactTable
      className="-striped"
      columns={[
        // Render the intl name of the field, or by default a title-case field:
        {
          Cell: ({ original: { field } }) => (
            <strong>
              <FieldHeader name={field} />
            </strong>
          ),
          Header: <DinaMessage id="attributeLabel" />,
          className: "key-cell",
          accessor: "field",
          width: 200
        },
        // Render the value as a string, or the custom cell component if one is defined:
        {
          Cell: props => {
            const CustomCell = customValueCells?.[props.original.field];
            if (CustomCell) {
              return <CustomCell {...props} />;
            }
            return props.value;
          },
          Header: <DinaMessage id="valueLabel" />,
          accessor: "value",
          className: "value-cell"
        }
      ]}
      data={entries}
      pageSize={entries.length || 1}
      showPagination={false}
      TdComponent={DefaultTd}
    />
  );
}
