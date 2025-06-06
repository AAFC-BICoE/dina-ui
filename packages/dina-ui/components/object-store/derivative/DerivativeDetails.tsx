import { DateView, FieldHeader, ReactTable, useCollapser } from "common-ui";
import { PersistedResource } from "kitsu";
import { get } from "lodash";
import { ReactNode } from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Derivative } from "../../../types/objectstore-api";
import { GroupLabel } from "../../group-select/GroupFieldView";
import { formatBytes } from "../object-store-utils";

export interface MetadataDetailsProps {
  derivative: PersistedResource<Derivative>;
}

/**
 * Shows the attribute details of a Metadata. Does not include the image or thumbnail.
 * The ManagedAttributeMap must be included with the passed Metadata.
 */
export function DerivativeDetails({ derivative }: MetadataDetailsProps) {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <DerivativeAttributeGroup
        derivative={derivative}
        fields={[
          ...((derivative as any).objectUpload
            ? [
                {
                  name: "Original Filename",
                  value: (derivative as any).objectUpload.originalFilename
                }
              ]
            : []),
          {
            name: "group",
            value: <GroupLabel groupName={(derivative as any).group} />
          },
          {
            name: "createdOn",
            value: <DateView date={derivative?.createdOn} />
          },
          {
            name: "createdBy",
            value: derivative?.createdBy
          },
          {
            name: "derivativeType",
            value: derivative?.derivativeType
          }
        ]}
        title={formatMessage("derivativeDetailsLabel")}
      />

      <DerivativeAttributeGroup
        derivative={derivative}
        fields={["dcFormat", "dcType", "fileExtension"]}
        title={formatMessage("metadataMediaDetailsLabel")}
      />

      <DerivativeAttributeGroup
        derivative={derivative}
        fields={[
          "fileIdentifier",
          ...(derivative?.acHashFunction ? ["acHashFunction"] : []),
          ...(derivative?.acHashValue ? ["acHashValue"] : []),
          ...((derivative as any).objectUpload?.sizeInBytes
            ? ["objectUpload.sizeInBytes"]
            : [])
        ]}
        title={formatMessage("metadataFileStorageDetailsLabel")}
      />
    </div>
  );
}

interface DerivativeAttributeGroup {
  derivative?: any;
  fields: (string | { name: string; value: ReactNode })[];
  title: string;
}

export function DerivativeAttributeGroup({
  derivative,
  fields,
  title
}: DerivativeAttributeGroup) {
  const data = fields.map((field) => {
    if (typeof field === "string") {
      if (field === "objectUpload.sizeInBytes") {
        const sizeInBytes = get(derivative, field);
        return { name: "fileSize", value: formatBytes(sizeInBytes) };
      }
      return { name: field, value: get(derivative, field) };
    }
    return field;
  });

  return (
    <CollapsableSection collapserId={title} title={title}>
      <ReactTable
        className="-striped"
        columns={[
          {
            id: "name",
            cell: ({
              row: {
                original: { name }
              }
            }) => (
              <strong>
                <FieldHeader name={name} />
              </strong>
            ),
            accessorKey: "name",
            header: () => <DinaMessage id="attributeLabel" />,
            enableSorting: true
          },
          {
            id: "managedAttributeValue",
            // The cell can render either JSX or a primitive (string/number etc.).
            cell: ({
              row: {
                original: { value }
              }
            }) => (value?.props ? <>{value}</> : String(value ?? "")),
            header: () => <DinaMessage id="managedAttributeValueLabel" />,
            accessorKey: "value",
            enableSorting: true
          }
        ]}
        data={data}
      />
    </CollapsableSection>
  );
}

interface CollapsableSectionProps {
  children: ReactNode;
  collapserId: string;
  title: ReactNode;
}

/** Wrapper for the collapsible sections of the details UI. */
export function CollapsableSection({
  children,
  collapserId,
  title
}: CollapsableSectionProps) {
  const { Collapser, collapsed } = useCollapser(
    `metadata-details-${collapserId}`
  );

  return (
    <div className="mb-3">
      <h4>
        {title}
        <Collapser />
      </h4>
      {!collapsed && children}
    </div>
  );
}
