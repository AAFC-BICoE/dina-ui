import { CellContext, ColumnDefTemplate } from "@tanstack/react-table";
import classNames from "classnames";
import { FieldHeader, ReactTable8 } from "common-ui";
import { toPairs } from "lodash";
import { ErrorBoundary } from "react-error-boundary";
import { ReadOnlyValue } from "../formik-connected/FieldView";
import { CommonMessage } from "../intl/common-ui-intl";

export interface KeyValueTable8Props {
  /** The object whose keys and values are to be shown. */
  data: Record<string, any>;

  /** The value cell Component for a specific field can be overriden for displaying complex object types. */
  customValueCells?: Record<string, ColumnDefTemplate<CellContext<any, any>>>;

  attributeHeader?: JSX.Element;
  valueHeader?: JSX.Element;

  attributeCell?: ColumnDefTemplate<CellContext<any, any>>;
  tableClassName?: string;
}

/** Table that shows an object's keys in the left column and values in the right column. */
export function KeyValueTable8({
  customValueCells,
  data,
  attributeHeader = <CommonMessage id="attributeLabel" />,
  attributeCell = ({
    row: {
      original: { field }
    }
  }) => (
    <strong>
      <FieldHeader name={field ?? ""} />
    </strong>
  ),
  valueHeader = <CommonMessage id="valueLabel" />,
  tableClassName
}: KeyValueTable8Props) {
  const pairs = toPairs(data);
  const entries = pairs.map(([field, value]) => ({
    field,
    value
  }));

  return (
    <ReactTable8
      className={classNames("-striped", tableClassName)}
      columns={[
        // Render the intl name of the field, or by default a title-case field:
        {
          cell: attributeCell,
          header: () => attributeHeader,
          accessorKey: "field",
          size: 200,
          meta: {
            className: "key-cell"
          }
        },
        // Render the value as a string, or the custom cell component if one is defined:
        {
          cell: (props) => {
            const CustomCell = customValueCells?.[props.row.original.field];
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

            return <ReadOnlyValue value={props.getValue()} />;
          },
          header: () => valueHeader,
          accessorKey: "value",
          meta: {
            cellClassName: "value-cell"
          }
        }
      ]}
      data={entries}
      showPagination={false}
    />
  );
}
