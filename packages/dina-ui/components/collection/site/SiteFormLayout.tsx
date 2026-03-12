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
import type { GeoPosition } from "packages/dina-ui/types/geo/geo.types";
import { Site } from "packages/dina-ui/types/collection-api";
import { PolygonEditorMode } from "packages/dina-ui/types/geo/polygon-editor-mode.types";
import PolygonEditorMap from "./PolygonEditorMap";

type Props = {
  mode: PolygonEditorMode;
  attachmentsConfig?: AllowAttachmentsConfig;
};

export default function SiteFormLayout({ mode, attachmentsConfig }: Props) {
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
        <div className={`col-md-6 ${coords.length === 0 && "mb-4"}`}>
          <div className="">
            <strong>{formatMessage("siteCoordinates")}</strong>
          </div>
          {(!readOnly || coords.length > 0) && (
            <PolygonEditorMap
              coords={coords}
              mode={mode}
              onCoordsChange={setCoords}
            />
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
