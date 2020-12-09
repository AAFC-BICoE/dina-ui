import { LoadingSpinner, useCollapser, useQuery } from "common-ui";
import ReactTable from "react-table";
import { ReactNode } from "react";
import { ObjectUpload } from "packages/dina-ui/types/objectstore-api/resources/ObjectUpload";
import { PersistedResource } from "kitsu";

interface ExifProps {
  exif: Map<string, string>;
}

function DisplayExif({ exif }: ExifProps) {
  function getColumns() {
    return Object.keys(exif).map(key => {
      return {
        Header: key,
        accessor: key
      };
    });
  }

  return (
    <ReactTable
      className="-striped"
      columns={getColumns()}
      showPagination={false}
      data={[exif]}
      defaultPageSize={1}
    />
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
  const { Collapser, collapsed } = useCollapser(`view-exif-${collapserId}`);

  return (
    <div className="form-group">
      <h4>
        {title}
        <Collapser />
      </h4>
      {!collapsed && children}
    </div>
  );
}

interface ObjectUploadProps {
  objectUpload: ObjectUpload;
}

export function ExifView({ objectUpload }: ObjectUploadProps) {
  if (!objectUpload) return null;
  return (
    <CollapsableSection
      collapserId={objectUpload.fileIdentifier}
      title={objectUpload.originalFilename}
      key={objectUpload.fileIdentifier}
    >
      {objectUpload.exif && <DisplayExif exif={objectUpload.exif} />}
    </CollapsableSection>
  );
}
