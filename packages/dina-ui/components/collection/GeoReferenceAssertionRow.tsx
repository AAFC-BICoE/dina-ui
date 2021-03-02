import { DateField, NumberField, FieldView, TextField } from "common-ui";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { GeoReferenceAssertion } from "../../types/collection-api/resources/GeoReferenceAssertion";

export interface GeoReferenceAssertionRowProps {
  index: number;
  assertion?: GeoReferenceAssertion;
  onAddClick?: () => void;
  onRemoveClick?: () => void;
  viewOnly?: boolean;
}

export function GeoReferenceAssertionRow({
  index,
  onAddClick,
  onRemoveClick,
  viewOnly
}: GeoReferenceAssertionRowProps) {
  const { formatMessage } = useDinaIntl();
  return (
    <>
      {viewOnly ? (
        <div className="row">
          <div className="col-md-5">
            <FieldView
              name={`geoReferenceAssertions[${index}].dwcDecimalLatitude`}
              label={formatMessage("decimalLatitude")}
              className={"dwcDecimalLatitude"}
            />
            <FieldView
              name={`geoReferenceAssertions[${index}].dwcDecimalLongitude`}
              label={formatMessage("decimalLongitude")}
              className={"dwcDecimalLongitude"}
            />
            <FieldView
              name={`geoReferenceAssertions[${index}].dwcCoordinateUncertaintyInMeters`}
              label={formatMessage("coordinateUncertaintyInMeters")}
              className={"dwcCoordinateUncertaintyInMeters"}
            />
            <FieldView
              name={`geoReferenceAssertions[${index}].dwcGeoreferencedDate`}
              className={"dwcGeoreferencedDate"}
              label={formatMessage("georeferencedDateLabel")}
            />
          </div>
          <div className="col-md-5">
            <FieldView
              name={`geoReferenceAssertions[${index}].literalGeoreferencedBy`}
              className={"literalGeoreferencedBy"}
              label={formatMessage("literalGeoreferencedByLabel")}
            />
            <FieldView
              name={`geoReferenceAssertions[${index}].dwcGeoreferenceProtocol`}
              className={"dwcGeoreferenceProtocol"}
              label={formatMessage("georeferenceProtocolLabel")}
            />
            <FieldView
              name={`geoReferenceAssertions[${index}].dwcGeoreferenceSources`}
              className={"dwcGeoreferenceSources"}
              label={formatMessage("georeferenceSourcesLabel")}
            />
            <FieldView
              name={`geoReferenceAssertions[${index}].dwcGeoreferenceRemarks`}
              className={"dwcGeoreferenceRemarks"}
              label={formatMessage("georeferenceRemarksLabel")}
            />
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-md-5">
            <NumberField
              name={`geoReferenceAssertions[${index}].dwcDecimalLatitude`}
              label={formatMessage("decimalLatitude")}
              className={"dwcDecimalLatitude"}
            />
            <NumberField
              name={`geoReferenceAssertions[${index}].dwcDecimalLongitude`}
              label={formatMessage("decimalLongitude")}
              readOnly={viewOnly}
              className={"dwcDecimalLongitude"}
            />
            <NumberField
              name={`geoReferenceAssertions[${index}].dwcCoordinateUncertaintyInMeters`}
              label={formatMessage("coordinateUncertaintyInMeters")}
              readOnly={viewOnly}
              className={"dwcCoordinateUncertaintyInMeters"}
            />
            <DateField
              name={`geoReferenceAssertions[${index}].dwcGeoreferencedDate`}
              className={"dwcGeoreferencedDate"}
              label={formatMessage("georeferencedDateLabel")}
              withZone={true}
            />
          </div>

          <div className="col-md-5">
            <TextField
              name={`geoReferenceAssertions[${index}].literalGeoreferencedBy`}
              className={"literalGeoreferencedBy"}
              label={formatMessage("literalGeoreferencedByLabel")}
            />
            <TextField
              name={`geoReferenceAssertions[${index}].dwcGeoreferenceProtocol`}
              className={"dwcGeoreferenceProtocol"}
              label={formatMessage("georeferenceProtocolLabel")}
            />
            <TextField
              name={`geoReferenceAssertions[${index}].dwcGeoreferenceSources`}
              className={"dwcGeoreferenceSources"}
              label={formatMessage("georeferenceSourcesLabel")}
            />
            <TextField
              name={`geoReferenceAssertions[${index}].dwcGeoreferenceRemarks`}
              className={"dwcGeoreferenceRemarks"}
              label={formatMessage("georeferenceRemarksLabel")}
            />
          </div>
        </div>
      )}
    </>
  );
}
