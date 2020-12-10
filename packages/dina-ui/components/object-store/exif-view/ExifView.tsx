import {
  ColumnDefinition,
  LoadingSpinner,
  useCollapser,
  useQuery
} from "common-ui";
import ReactTable from "react-table";
import { ReactNode } from "react";
import { ObjectUpload } from "packages/dina-ui/types/objectstore-api/resources/ObjectUpload";
import { useDinaIntl } from "../../../intl/dina-ui-intl";

interface ExifProps {
  exif: Map<string, string>;
}

interface ObjectUploadProps {
  objectUpload: ObjectUpload;
}

function DisplayExif({ exif }: ExifProps) {
  const { formatMessage } = useDinaIntl();
  const ExifMaps = Object.keys(exif).map(key => {
    return {
      propKey: key,
      propValue: exif[key]
    };
  });
  const METADATA_TABLE_COLUMNS = [
    {
      Header: formatMessage("exifAttribute"),
      accessor: "propKey"
    },
    {
      Header: formatMessage("exifValue"),
      accessor: "propValue"
    }
  ];
  return (
    <ReactTable
      className="-striped"
      columns={METADATA_TABLE_COLUMNS}
      showPagination={false}
      data={ExifMaps}
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
export function ExifView({ objectUpload }: ObjectUploadProps) {
  if (objectUpload && objectUpload.exif) 
  {    
    const { formatMessage } = useDinaIntl();
    return (
      <CollapsableSection
        collapserId={objectUpload.fileIdentifier}
        title={formatMessage("exifProperties")}
        key={objectUpload.fileIdentifier}
      >
      <DisplayExif exif={objectUpload.exif} />
      </CollapsableSection>
    );
  }
  return null;
}
