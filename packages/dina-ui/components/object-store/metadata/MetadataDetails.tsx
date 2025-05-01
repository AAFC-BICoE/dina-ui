import {
  ApiClientContext,
  DateView,
  FieldHeader,
  ReactTable,
  useCollapser
} from "common-ui";
import { PersistedResource } from "kitsu";
import { find, get } from "lodash";
import { ReactNode, useContext, useEffect, useState } from "react";
import { ORIENTATION_OPTIONS } from "../../../../dina-ui/pages/object-store/metadata/edit";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { License, Metadata } from "../../../types/objectstore-api";
import { GroupLabel } from "../../group-select/GroupFieldView";
import { ManagedAttributesViewer } from "../../managed-attributes/ManagedAttributesViewer";

const DERIVATIVE_TYPE_MESSAGES = new Map<string, string>([
  ["THUMBNAIL_IMAGE", "thumbnail"],
  ["LARGE_IMAGE", "largeImg"]
]);

export interface MetadataDetailsProps {
  metadata: PersistedResource<Metadata>;
}

/**
 * Shows the attribute details of a Metadata. Does not include the image or thumbnail.
 * Tha ManagedAttributeMap must b included with the passed Metadata.
 */
export function MetadataDetails({ metadata }: MetadataDetailsProps) {
  const { formatMessage, locale, messages } = useDinaIntl();
  const { apiClient } = useContext(ApiClientContext);
  const [license, setLicense] = useState<string>();

  useEffect(() => {
    loadData().then((licenseLabel) => {
      setLicense(licenseLabel);
    });
  }, []);

  async function loadData() {
    const selectedLicense = await apiClient.get<License[]>(
      `objectstore-api/license?filter[url]=${metadata.xmpRightsWebStatement}`,
      {}
    );
    const licenses: License[] = selectedLicense?.data;

    return licenses && licenses.length > 0
      ? licenses[0].titles[locale] ?? licenses[0]?.url
      : undefined;
  }

  const isExternalResource = !!metadata.resourceExternalURL;
  return (
    <div>
      <MetadataAttributeGroup
        metadata={metadata}
        fields={[
          ...(isExternalResource ? ["resourceExternalURL"] : []),
          ...(!isExternalResource ? ["originalFilename"] : []),
          {
            name: "acDigitizationDate",
            value: <DateView date={metadata.acDigitizationDate} />
          },
          {
            name: "group",
            value: <GroupLabel groupName={metadata.group} />
          },
          {
            name: "createdOn",
            value: <DateView date={metadata.createdOn} />
          },
          {
            name: "xmpMetadataDate",
            value: <DateView date={metadata.xmpMetadataDate} />
          },
          "acMetadataCreator.displayName"
        ]}
        title={
          isExternalResource
            ? formatMessage("metadataExternalResourceDetailsLabel")
            : formatMessage("metadataUploadDetailsLabel")
        }
      />

      <CollapsableSection
        collapserId="managed-attributes"
        title={formatMessage("metadataManagedAttributesLabel")}
      >
        <ManagedAttributesViewer
          values={metadata.managedAttributes}
          managedAttributeApiPath="objectstore-api/managed-attribute"
        />
      </CollapsableSection>

      <CollapsableSection
        collapserId="derivatives"
        title={formatMessage("derivatives")}
      >
        <ReactTable
          className="-striped"
          columns={[
            {
              id: "type",
              accessorKey: "derivativeType",
              header: () => <DinaMessage id="type" />,
              cell: ({
                row: {
                  original: { derivativeType }
                }
              }) =>
                messages?.[
                  DERIVATIVE_TYPE_MESSAGES.get(derivativeType) ?? ""
                ] ? (
                  <strong>
                    <DinaMessage
                      id={
                        DERIVATIVE_TYPE_MESSAGES.get(derivativeType) ??
                        (derivativeType as any)
                      }
                    />
                  </strong>
                ) : (
                  <strong>derivativeType</strong>
                ),
              enableSorting: true
            },
            {
              id: "actions",
              accessorKey: "actions",
              header: () => <DinaMessage id="actions" />,
              enableSorting: false
            }
          ]}
          data={metadata.derivatives ?? []}
        />
      </CollapsableSection>

      <MetadataAttributeGroup
        metadata={metadata}
        fields={[
          "dcFormat",
          "acCaption",
          "dcType",
          "acSubtype",
          "fileExtension",
          "dcCreator.displayName",
          {
            name: "orientation",
            value: find(
              ORIENTATION_OPTIONS,
              (option) => option.value === metadata.orientation
            )?.label
          }
        ]}
        title={formatMessage("metadataMediaDetailsLabel")}
      />
      <MetadataAttributeGroup
        metadata={metadata}
        fields={["dcRights", { name: "xmpRightsWebStatement", value: license }]}
        title={formatMessage("metadataRightsDetailsLabel")}
      />
      {!isExternalResource && (
        <MetadataAttributeGroup
          metadata={metadata}
          fields={[
            "fileIdentifier",
            "acHashFunction",
            "acHashValue",
            "objectUpload.sizeInBytes"
          ]}
          title={formatMessage("metadataFileStorageDetailsLabel")}
        />
      )}
    </div>
  );
}

interface MetadataAttributeGroupProps {
  metadata: Metadata;
  fields: (string | { name: string; value: ReactNode })[];
  title: string;
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function MetadataAttributeGroup({
  metadata,
  fields,
  title
}: MetadataAttributeGroupProps) {
  const data = fields.map((field) => {
    if (typeof field === "string") {
      if (field === "objectUpload.sizeInBytes") {
        const sizeInBytes = get(metadata, field);
        return { name: "fileSize", value: formatBytes(sizeInBytes) };
      }
      return { name: field, value: get(metadata, field) };
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
