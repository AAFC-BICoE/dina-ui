import { DinaForm, FieldSet, TextField } from "common-ui";
import { PersistedResource } from "kitsu";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api";

export interface CollectingEventBriefDetailsProps {
  collectingEvent: PersistedResource<CollectingEvent>;
}

/** Shows just the main details of a Collecting Event. */
export function CollectingEventBriefDetails({
  collectingEvent
}: CollectingEventBriefDetailsProps) {
  return (
    <DinaForm initialValues={collectingEvent} readOnly={true}>
      <div className="row">
        <div className="col-sm-6">
          <FieldSet legend={<DinaMessage id="collectingDateLegend" />}>
            <TextField name="startEventDateTime" />
            {collectingEvent.endEventDateTime && (
              <TextField name="endEventDateTime" />
            )}
            <TextField name="verbatimEventDateTime" />
          </FieldSet>
        </div>
        <div className="col-sm-6">
          <FieldSet legend={<DinaMessage id="collectingLocationLegend" />}>
            <TextField name="dwcVerbatimLocality" />
            <TextField name="dwcVerbatimCoordinateSystem" />
            <TextField name="dwcVerbatimLatitude" />
            <TextField name="dwcVerbatimLongitude" />
          </FieldSet>
        </div>
      </div>
    </DinaForm>
  );
}
