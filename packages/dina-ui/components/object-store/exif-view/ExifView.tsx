import { KeyValueTable } from "common-ui";
import { ObjectUpload } from "../../../types/objectstore-api/resources/ObjectUpload";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollapsableSection } from "../metadata/MetadataDetails";

interface ObjectUploadProps {
  objectUpload: ObjectUpload;
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
        collapserId={objectUpload?.id ?? ""}
        title={formatMessage("exifProperties")}
        key={objectUpload.id}
      >
        <KeyValueTable data={objectUpload.exif} />
      </CollapsableSection>
    );
  }
  return null;
}
