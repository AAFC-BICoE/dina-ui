import { DefaultTd, FieldHeader } from "common-ui";
import { isArray, toPairs } from "lodash";
import { ComponentType } from "react";
import ReactTable, { CellInfo, TableCellRenderer } from "react-table";
import { ReadOnlyValue } from "../formik-connected/FieldView";
import { CommonMessage } from "../intl/common-ui-intl";
import { ErrorBoundary } from "react-error-boundary";
import classNames from "classnames";

export interface KeyValueTableProps {
  /** The object whose keys and values are to be shown. */
  data: Record<string, any>;

  /** The value cell Component for a specific field can be overriden for displaying complex object types. */
  customValueCells?: Record<string, ComponentType<CellInfo>>;

  attributeHeader?: JSX.Element;
  valueHeader?: JSX.Element;

  attributeCell?: TableCellRenderer;
  tableClassName?: string;
}

/** Table that shows an object's keys in the left column and values in the right column. */
export function KeyValueTable({
  customValueCells,
  data,
  attributeHeader = <CommonMessage id="attributeLabel" />,
  attributeCell = ({ original: { field } }) => (
    <strong>
      <FieldHeader name={field} />
    </strong>
  ),
  valueHeader = <CommonMessage id="valueLabel" />,
  tableClassName
}: KeyValueTableProps) {
  const pairs = toPairs(data);
  const entries = pairs.map(([field, value]) => ({
    field,
    value
  }));

  return (
    <ReactTable
      className={classNames("-striped", tableClassName)}
      columns={[
        // Render the intl name of the field, or by default a title-case field:
        {
          Cell: attributeCell,
          Header: attributeHeader,
          className: "key-cell",
          accessor: "field",
          width: 200
        },
        // Render the value as a string, or the custom cell component if one is defined:
        {
          Cell: props => {
            const CustomCell = customValueCells?.[props.original.field];
            if (CustomCell) {
              return (
                <ErrorBoundary
                  // The error boundary is just for render errors
                  // so an error thrown in a cell's render function kills just that cell,
                  // not the whole page.
                  FallbackComponent={({ error: renderError }) => (
                    <div className="alert alert-danger" role="alert">
                      <pre className="mb-0">{renderError.message}</pre>
                    </div>
                  )}
                >
                  <CustomCell {...props} />
                </ErrorBoundary>
              );
            }

            return <ReadOnlyValue value={props.value} />;
          },
          Header: valueHeader,
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
