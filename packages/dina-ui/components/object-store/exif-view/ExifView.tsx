import { KeyValueTable, useCollapser } from "common-ui";
import { ReactNode } from "react";
import { ObjectUpload } from "../../../types/objectstore-api/resources/ObjectUpload";
import { useDinaIntl } from "../../../intl/dina-ui-intl";

interface ObjectUploadProps {
  objectUpload: ObjectUpload;
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
    <div className="mb-3">
      <h4>
        {title}
        <Collapser />
      </h4>
      {!collapsed && children}
    </div>
  );
}
export function ExifView({ objectUpload }: ObjectUploadProps) {
  if (
    objectUpload &&
    objectUpload.exif &&
    Object.keys(objectUpload.exif).length > 0
  ) {
    const { formatMessage } = useDinaIntl();
    return (
      <CollapsableSection
        collapserId={objectUpload.fileIdentifier}
        title={formatMessage("exifProperties")}
        key={objectUpload.fileIdentifier}
      >
        <KeyValueTable data={objectUpload.exif} />
      </CollapsableSection>
    );
  }
  return null;
}
