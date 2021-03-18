import { useQuery } from "common-ui";
import { KitsuResource } from "kitsu";
import { toPairs } from "lodash";
import ReactTable from "react-table";
import { DinaMessage } from "../../../intl/dina-ui-intl";

export interface ManagedAttributesViewerProps {
  /**
   * Map of Managed Attributes values.
   * Key is Managed Attribute UUID and value is the Managed Attribute value object.
   */
  values?: Record<
    string,
    { name?: string; value?: string; assignedValue?: string }
  >;

  managedAttributeApiPath: (id: string) => string;
}

export function ManagedAttributesViewer({
  values,
  managedAttributeApiPath
}: ManagedAttributesViewerProps) {
  const managedAttributeValues = values
    ? toPairs(values).map(([id, mav]) => ({ id, ...mav }))
    : [];

  return (
    <ReactTable
      className="-striped"
      columns={[
        {
          Cell: ({ original: { id, name } }) => (
            <strong>
              {name ?? (
                <ManagedAttributeName
                  managedAttributeApiPath={managedAttributeApiPath}
                  id={id}
                />
              )}
            </strong>
          ),
          Header: <DinaMessage id="attributeLabel" />,
          accessor: "name"
        },
        {
          Header: <DinaMessage id="managedAttributeValueLabel" />,
          accessor: row => row.value ?? row.assignedValue,
          id: "value"
        }
      ]}
      data={managedAttributeValues}
      pageSize={managedAttributeValues.length || 1}
      showPagination={false}
    />
  );
}

/** Render the name of a ManagedAttribute. */
export function ManagedAttributeName({ id, managedAttributeApiPath }) {
  const { response } = useQuery<KitsuResource & { name: string }>({
    path: managedAttributeApiPath(id)
  });

  return response?.data?.name ? <>{response?.data?.name}</> : null;
}
