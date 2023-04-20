import {
  ApiClientContext,
  DateView,
  FieldHeader,
  useCollapser
} from "common-ui";
import { PersistedResource } from "kitsu";
import { find, get } from "lodash";
import { ReactNode, useContext, useEffect, useState } from "react";
import ReactTable from "react-table";
import { ORIENTATION_OPTIONS } from "../../../../dina-ui/pages/object-store/metadata/edit";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { License, Metadata } from "../../../types/objectstore-api";
import { GroupLabel } from "../../group-select/GroupFieldView";
import { ManagedAttributesViewer } from "../../managed-attributes/ManagedAttributesViewer";

export interface MetadataDetailsProps {
  metadata: PersistedResource<Metadata>;
}

/**
 * Shows the attribute details of a Metadata. Does not include the image or thumbnail.
 * Tha ManagedAttributeMap must b included with the passed Metadata.
 */
export function MetadataDetails({ metadata }: MetadataDetailsProps) {
  const { formatMessage, locale } = useDinaIntl();
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
    const licenses: License[] = selectedLicense.data;

    return licenses.length > 0
      ? licenses[0].titles[locale] ?? licenses[0]?.url
      : undefined;
  }

  const isExternalResource = !!metadata.resourceExternalURL;
  return (
    <div>
      <MetadataAttributeGroup
        metadata={metadata}
        fields={[
          {
            name: "group",
            value: <GroupLabel groupName={metadata.group} />
          },
          {
            name: "createdDate",
            value: <DateView date={metadata.createdDate} />
          },
          {
            name: "xmpMetadataDate",
            value: <DateView date={metadata.xmpMetadataDate} />
          },
          "acMetadataCreator.displayName",
          "acSubtype"
        ]}
        title={
          isExternalResource
            ? formatMessage("metadataExternalResourceDetailsLabel")
            : formatMessage("metadataUploadDetailsLabel")
        }
      />
      {!isExternalResource && (
        <CollapsableSection
          collapserId="managed-attributes"
          title={formatMessage("metadataManagedAttributesLabel")}
        >
          <ManagedAttributesViewer
            values={metadata.managedAttributes}
            managedAttributeApiPath="objectstore-api/managed-attribute"
          />
        </CollapsableSection>
      )}
      <MetadataAttributeGroup
        metadata={metadata}
        fields={[
          ...(isExternalResource ? ["resourceExternalURL"] : []),
          "dcFormat",
          "acCaption",
          {
            name: "acDigitizationDate",
            value: <DateView date={metadata.acDigitizationDate} />
          },
          "dcType",
          ...(!isExternalResource ? ["originalFilename"] : []),
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
          fields={["fileIdentifier", "acHashFunction", "acHashValue"]}
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

function MetadataAttributeGroup({
  metadata,
  fields,
  title
}: MetadataAttributeGroupProps) {
  const data = fields.map((field) => {
    if (typeof field === "string") {
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
            Cell: ({ original: { name } }) => (
              <strong>
                <FieldHeader name={name} />
              </strong>
            ),
            Header: <DinaMessage id="attributeLabel" />,
            accessor: "name"
          },
          {
            // The cell can render either JSX or a primitive (string/number etc.).
            Cell: ({ original: { value } }) =>
              value?.props ? <>{value}</> : String(value ?? ""),
            Header: <DinaMessage id="managedAttributeValueLabel" />,
            accessor: "value"
          }
        ]}
        data={data}
        pageSize={data.length || 1}
        showPagination={false}
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
function CollapsableSection({
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
