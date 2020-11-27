import { useCollapser } from "common-ui";
import ReactTable from "react-table";
import { ReactNode } from "react";

interface ExifProps {
  exif: Map<string, string>;
}

export interface FileUploadResponse {
  fileIdentifier: string;
  metaFileEntryVersion: string;
  originalFilename: string;
  sha1Hex: string;
  receivedMediaType: string;
  detectedMediaType: string;
  detectedFileExtension: string;
  evaluatedMediaType: string;
  evaluatedFileExtension: string;
  sizeInBytes: number;
  exif: Map<string, string>;
  dateTimeDigitized?: string;
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

export default function ViewExif(resp: FileUploadResponse) {
  return (
    <CollapsableSection
      collapserId={resp.fileIdentifier}
      title={resp.originalFilename}
      key={resp.fileIdentifier}
    >
      {resp.exif && <DisplayExif exif={resp.exif} />}
    </CollapsableSection>
  );
}
