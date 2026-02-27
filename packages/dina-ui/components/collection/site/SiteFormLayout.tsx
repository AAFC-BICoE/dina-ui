import { useEffect, useState } from "react";
import { useField } from "formik";
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
import GeometryMapEditorLauncher from "packages/dina-ui/components/geo/GeometryMapEditorLauncher";
import type { GeoPosition } from "packages/dina-ui/types/geo/geo.types";
import {
  PostMessage,
  PostMessageType
} from "packages/dina-ui/types/geo/post-message.types";

function parsePolygon(value: string): GeoPosition[][] {
  const nums = value.split(",").map(Number);

  const ring: GeoPosition[] = [];
  for (let i = 0; i < nums.length; i += 2) {
    ring.push([nums[i], nums[i + 1]]);
  }

  return [ring];
}

type Props = {
  popupUrl: string;
  messageId: string;
  attachmentsConfig?: AllowAttachmentsConfig;
};

export function SiteFormLayout({
  popupUrl,
  messageId,
  attachmentsConfig
}: Props) {
  const { formatMessage } = useDinaIntl();
  const { readOnly } = useDinaFormContext();
  const [{ value }] = useField("siteGeom");
  const [siteGeom, setSiteGeom] = useState<GeoPosition[][]>(value ?? []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<PostMessage>) => {
      if (event.origin !== window.location.origin) return;

      if (
        event.data?.type === PostMessageType.PolygonCreated ||
        event.data?.type === PostMessageType.PolygonEdited
      ) {
        setSiteGeom(event.data.coordinates ?? []);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

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
        <div className="col-md-6">
          <div style={{ marginBottom: "10px" }}>
            <strong>{formatMessage("siteCoordinates")}</strong>
          </div>
          {readOnly ? (
            <pre>
              {siteGeom.length
                ? JSON.stringify(parsePolygon(siteGeom.toString()))
                : ""}
            </pre>
          ) : (
            <textarea
              value={
                siteGeom && siteGeom.length
                  ? JSON.stringify(siteGeom, null, 2)
                  : ""
              }
              readOnly
              className="form-control"
              style={{ height: "80px", marginBottom: "15px" }}
            />
          )}
        </div>
        <div style={{ marginBottom: "25px" }}>
          {(value || messageId !== "viewOnMap") && (
            <GeometryMapEditorLauncher
              type="Polygon"
              fieldName="siteGeom"
              siteGeom={siteGeom}
              url={popupUrl}
              messageId={messageId}
            />
          )}
        </div>
      </div>
      <MultilingualDescription />
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
