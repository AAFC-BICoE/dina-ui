import { useEffect, useState } from "react";
import { useField, useFormikContext } from "formik";
import {
  DateField,
  MultilingualDescription,
  DinaFormSection,
  TextField,
  useDinaFormContext
} from "common-ui";
import {
  AttachmentsField,
  GroupSelectField
} from "packages/dina-ui/components";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { AllowAttachmentsConfig } from "packages/dina-ui/components/object-store";
import { Site } from "packages/dina-ui/types/collection-api";
import PolygonEditorMap from "./PolygonEditorMap";
import { MapToggleSwitch } from "./MapToggleSwitch";
import PolygonEditorCoordinates from "./PolygonEditorCoordinates";
import type { PolygonEditorMode } from "packages/dina-ui/types/geo/polygon-editor-mode.types";
import type { GeoPosition } from "packages/dina-ui/types/geo/geo.types";

export default function SiteFormLayout({
  mode,
  attachmentsConfig
}: {
  mode: PolygonEditorMode;
  attachmentsConfig?: AllowAttachmentsConfig;
}) {
  const { formatMessage } = useDinaIntl();
  const { readOnly } = useDinaFormContext();
  const [{ value }] = useField("siteGeom");
  const [coords, setCoords] = useState<GeoPosition[][]>(
    value?.coordinates ?? []
  );
  const { setFieldValue } = useFormikContext<Site>();

  useEffect(() => {
    setFieldValue("siteGeom", {
      type: "Polygon",
      coordinates: coords
    });
  }, [coords, setFieldValue]);

  const [showMap, setShowMap] = useState(true);

  return (
    <div>
      <div className="row">
        {!readOnly && (
          <GroupSelectField
            className="col-md-6"
            name="group"
            enableStoredDefaultGroup={true}
          />
        )}
      </div>
      <div className="row">
        <TextField
          className="col-md-6"
          name="name"
          label={formatMessage("name")}
        />
        <TextField
          className="col-md-6"
          name="code"
          label={formatMessage("code")}
        />
      </div>
      <div className="row">
        {readOnly && coords.length === 0 && (
          <div className="col-md-6 mb-4">
            <strong>{formatMessage("siteMap")}</strong>
          </div>
        )}
        <div className={readOnly && !showMap ? "col-md-12" : "col-md-6"}>
          {(!readOnly || coords.length > 0) && (
            <>
              <MapToggleSwitch
                showMap={showMap}
                onToggle={setShowMap}
                formatMessage={formatMessage}
              />
              {showMap ? (
                <PolygonEditorMap
                  coords={coords}
                  mode={mode}
                  onCoordsChange={setCoords}
                />
              ) : (
                <PolygonEditorCoordinates
                  coords={coords}
                  mode={mode}
                  onCoordsChange={setCoords}
                />
              )}
            </>
          )}
        </div>
      </div>
      <MultilingualDescription />
      {readOnly && (
        <div className="row">
          <DateField
            className="col-md-6"
            name="createdOn"
            label={formatMessage("field_createdOn")}
          />
          <TextField
            className="col-md-6"
            name="createdBy"
            label={formatMessage("field_createdBy")}
          />
        </div>
      )}
      <div className="mb-3">
        <DinaFormSection
          componentName="site-component"
          sectionName="site-attachments-section"
        >
          <AttachmentsField
            name="attachment"
            title={<DinaMessage id="siteAttachments" />}
            allowNewFieldName="attachmentsConfig.allowNew"
            allowExistingFieldName="attachmentsConfig.allowExisting"
            allowAttachmentsConfig={attachmentsConfig}
          />
        </DinaFormSection>
      </div>
    </div>
  );
}
