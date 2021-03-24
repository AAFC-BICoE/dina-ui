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

  /** Function that returns the API find-one path given the Managed Attribute key or ID. */
  managedAttributeApiPath: (key: string) => string;
}

export function ManagedAttributesViewer({
  values,
  managedAttributeApiPath
}: ManagedAttributesViewerProps) {
  const managedAttributeValues = values
    ? toPairs(values).map(([key, mav]) => ({ key, ...mav }))
    : [];

  return (
    <ReactTable
      className="-striped"
      columns={[
        {
          Cell: ({ original: { key, name } }) => (
            <strong>
              {name ?? (
                <ManagedAttributeName
                  managedAttributeApiPath={managedAttributeApiPath}
                  managedAttributeKey={key}
                />
              )}
            </strong>
          ),
          Header: <DinaMessage id="attributeLabel" />,
          accessor: row => row.name ?? row.key,
          id: "name"
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
export function ManagedAttributeName({
  managedAttributeKey,
  managedAttributeApiPath
}) {
  const { response } = useQuery<KitsuResource & { name: string }>({
    path: managedAttributeApiPath(managedAttributeKey)
  });

  return <>{response?.data?.name ?? managedAttributeKey}</>;
}
